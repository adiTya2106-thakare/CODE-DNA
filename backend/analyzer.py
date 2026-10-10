"""
CODE DNA — Static AST analyzer for impact graph and bug analysis
"""
import ast
import textwrap
from dataclasses import dataclass, field


@dataclass
class GraphNode:
    id: str
    label: str
    type: str  # function | variable | class | module | import
    defined_at: int | None = None
    source: str = "script.py"


@dataclass
class GraphEdge:
    source: str
    target: str
    type: str  # calls | assigns | imports | defines | uses
    is_runtime: bool = False


@dataclass
class ImpactGraph:
    nodes: list[GraphNode] = field(default_factory=list)
    edges: list[GraphEdge] = field(default_factory=list)


class ASTAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.nodes: dict[str, GraphNode] = {}
        self.edges: list[GraphEdge] = []
        self._current_function: str | None = None

        # Built-in functions to track
        self._builtins = {"range", "len", "print", "sum", "min", "max", "sorted", "enumerate", "zip"}

    def _add_node(self, node_id: str, label: str, ntype: str, line: int | None = None):
        if node_id not in self.nodes:
            self.nodes[node_id] = GraphNode(id=node_id, label=label, type=ntype, defined_at=line)

    def _add_edge(self, src: str, tgt: str, etype: str):
        # Avoid duplicate edges
        for e in self.edges:
            if e.source == src and e.target == tgt and e.type == etype:
                return
        self.edges.append(GraphEdge(source=src, target=tgt, type=etype))

    def visit_FunctionDef(self, node):
        func_id = node.name
        self._add_node(func_id, f"{node.name}()", "function", node.lineno)
        prev = self._current_function
        self._current_function = func_id
        self.generic_visit(node)
        self._current_function = prev

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_ClassDef(self, node):
        class_id = f"class_{node.name}"
        self._add_node(class_id, node.name, "class", node.lineno)
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            mod_id = f"import_{alias.name}"
            label = alias.asname or alias.name
            self._add_node(mod_id, label, "import")
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module:
            mod_id = f"import_{node.module}"
            self._add_node(mod_id, node.module, "import")
        self.generic_visit(node)

    def visit_Assign(self, node):
        for target in node.targets:
            if isinstance(target, ast.Name):
                var_id = f"var_{target.id}"
                self._add_node(var_id, target.id, "variable", node.lineno)
                if self._current_function:
                    self._add_edge(self._current_function, var_id, "assigns")
                # Record what the assignment uses
                for child in ast.walk(node.value):
                    if isinstance(child, ast.Name) and f"var_{child.id}" in self.nodes:
                        self._add_edge(f"var_{child.id}", var_id, "uses")
        self.generic_visit(node)

    def visit_Call(self, node):
        # Determine what's being called
        if isinstance(node.func, ast.Name):
            callee = node.func.id
            if callee in self._builtins:
                builtin_id = f"builtin_{callee}"
                self._add_node(builtin_id, f"{callee}()", "import")
                if self._current_function:
                    self._add_edge(self._current_function, builtin_id, "calls")
            elif callee in self.nodes:
                if self._current_function:
                    self._add_edge(self._current_function, callee, "calls")
            else:
                # Mark as unknown function call
                self._add_node(callee, f"{callee}()", "function")
                if self._current_function:
                    self._add_edge(self._current_function, callee, "calls")
        self.generic_visit(node)

    def visit_Name(self, node):
        # Track variable uses
        if isinstance(node.ctx, ast.Load):
            var_id = f"var_{node.id}"
            if var_id in self.nodes and self._current_function:
                self._add_edge(var_id, self._current_function, "uses")
        self.generic_visit(node)


def analyze_impact(code: str) -> ImpactGraph:
    """Build an impact graph from Python code using AST analysis."""
    try:
        tree = ast.parse(textwrap.dedent(code))
    except SyntaxError as e:
        return ImpactGraph(
            nodes=[GraphNode(id="error", label=f"SyntaxError: {e}", type="module")],
            edges=[]
        )

    analyzer = ASTAnalyzer()
    analyzer.visit(tree)

    return ImpactGraph(
        nodes=list(analyzer.nodes.values()),
        edges=analyzer.edges,
    )


def detect_bug_patterns(code: str, error_output: str | None = None) -> dict:
    """
    Detect common bug patterns through static analysis.
    Returns structured findings.
    """
    findings = {
        "patterns": [],
        "suspicious_lines": [],
    }

    try:
        tree = ast.parse(textwrap.dedent(code))
    except SyntaxError as e:
        findings["patterns"].append({
            "type": "SyntaxError",
            "description": str(e),
            "line": e.lineno,
        })
        return findings

    lines = code.split("\n")

    for node in ast.walk(tree):
        # Off-by-one in range
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "range":
                for arg in node.args:
                    if isinstance(arg, ast.BinOp) and isinstance(arg.op, ast.Add):
                        if isinstance(arg.right, ast.Constant) and arg.right.value == 1:
                            findings["patterns"].append({
                                "type": "OffByOne",
                                "description": "range() call adds +1 which may cause IndexError",
                                "line": node.lineno,
                                "confidence": "high",
                            })
                            findings["suspicious_lines"].append(node.lineno)

        # Division without zero check
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div):
            if isinstance(node.right, ast.Name):
                # Check if there's a zero guard
                findings["patterns"].append({
                    "type": "PotentialDivisionByZero",
                    "description": f"Division by variable '{node.right.id}' — no zero-check detected",
                    "line": getattr(node, "lineno", 0),
                    "confidence": "low",
                })

    return findings
