"""
CODE DNA — Backend tests
Tests the tracer, analyzer, and API endpoints.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from tracer import execute_python
from analyzer import analyze_impact, detect_bug_patterns


# ─── Tracer tests ────────────────────────────────────────────────────────────

class TestTracer:
    def test_simple_execution(self):
        """Simple code executes and produces output."""
        trace = execute_python("print('hello')")
        assert trace.error is None
        assert "hello" in trace.output

    def test_off_by_one_bug(self):
        """Off-by-one error is recorded as an exception step."""
        code = """
numbers = [1, 2, 3]
for i in range(len(numbers) + 1):
    print(numbers[i])
"""
        trace = execute_python(code)
        assert trace.error is not None
        assert "IndexError" in trace.error
        assert len(trace.steps) > 0

    def test_variable_tracking(self):
        """Variables are captured in step snapshots."""
        code = """
x = 10
y = 20
z = x + y
"""
        trace = execute_python(code)
        assert trace.error is None
        # Find a step where z is defined
        z_steps = [s for s in trace.steps if "z" in s.variables]
        assert len(z_steps) > 0
        assert z_steps[-1].variables["z"] == "30"

    def test_function_call_tracking(self):
        """Function calls create call events."""
        code = """
def add(a, b):
    return a + b

result = add(3, 4)
"""
        trace = execute_python(code)
        assert trace.error is None
        call_steps = [s for s in trace.steps if s.event == "call" and s.function_name == "add"]
        assert len(call_steps) > 0

    def test_stdout_captured(self):
        """stdout is captured in trace output."""
        code = """
for i in range(3):
    print(f"line {i}")
"""
        trace = execute_python(code)
        assert trace.error is None
        assert "line 0" in trace.output
        assert "line 1" in trace.output
        assert "line 2" in trace.output

    def test_step_limit(self):
        """Execution is limited to MAX_STEPS steps."""
        code = """
for i in range(1000):
    x = i * 2
"""
        trace = execute_python(code)
        assert len(trace.steps) <= 200 + 10  # allow small buffer

    def test_syntax_error(self):
        """Syntax errors are reported cleanly."""
        trace = execute_python("def broken(: pass")
        assert trace.error is not None

    def test_division_by_zero(self):
        """ZeroDivisionError is caught and reported."""
        trace = execute_python("x = 1 / 0")
        assert trace.error is not None
        assert "ZeroDivisionError" in trace.error

    def test_fixed_code_passes(self):
        """The fixed demo code executes without error."""
        fixed = """
def calculate_average(numbers):
    total = 0
    for i in range(len(numbers)):
        total += numbers[i]
    return total / len(numbers)

scores = [72, 45, 88, 91, 55, 78, 82, 69]
avg = calculate_average(scores)
print(f"Average: {avg:.2f}")
"""
        trace = execute_python(fixed)
        assert trace.error is None
        assert "72.50" in trace.output


# ─── Analyzer tests ──────────────────────────────────────────────────────────

class TestAnalyzer:
    def test_function_nodes(self):
        """Functions are detected as nodes."""
        code = """
def foo():
    pass

def bar():
    foo()
"""
        graph = analyze_impact(code)
        node_ids = {n.id for n in graph.nodes}
        assert "foo" in node_ids
        assert "bar" in node_ids

    def test_call_edges(self):
        """Function calls create call edges."""
        code = """
def foo():
    pass

def bar():
    foo()
"""
        graph = analyze_impact(code)
        edges = [(e.source, e.target, e.type) for e in graph.edges]
        assert ("bar", "foo", "calls") in edges

    def test_variable_nodes(self):
        """Variables are detected."""
        code = """
x = 10
y = x + 5
"""
        graph = analyze_impact(code)
        node_ids = {n.id for n in graph.nodes}
        assert "var_x" in node_ids
        assert "var_y" in node_ids

    def test_builtin_tracking(self):
        """Built-in calls are tracked."""
        code = """
def foo(lst):
    return len(lst)
"""
        graph = analyze_impact(code)
        node_ids = {n.id for n in graph.nodes}
        assert "builtin_len" in node_ids

    def test_syntax_error_graceful(self):
        """Syntax errors return a partial graph, not an exception."""
        graph = analyze_impact("def broken(: pass")
        assert len(graph.nodes) >= 1
        assert graph.nodes[0].type in ("module", "import", "function") or "error" in graph.nodes[0].id.lower()

    def test_off_by_one_detection(self):
        """Off-by-one pattern is detected in static analysis."""
        code = """
numbers = [1, 2, 3]
for i in range(len(numbers) + 1):
    print(numbers[i])
"""
        findings = detect_bug_patterns(code)
        patterns = findings.get("patterns", [])
        off_by_one = [p for p in patterns if p["type"] == "OffByOne"]
        assert len(off_by_one) > 0
        assert off_by_one[0]["confidence"] == "high"


# ─── Integration test ────────────────────────────────────────────────────────

class TestDemoFlow:
    """Test the full 2-minute demo flow."""

    def test_buggy_code_crashes(self):
        """Demo buggy code raises IndexError."""
        buggy = """
def calculate_average(numbers):
    total = 0
    for i in range(len(numbers) + 1):
        total += numbers[i]
    return total / len(numbers)

scores = [72, 45, 88, 91, 55, 78, 82, 69]
avg = calculate_average(scores)
"""
        trace = execute_python(buggy)
        assert trace.error is not None
        assert "IndexError" in trace.error

    def test_fixed_code_succeeds(self):
        """Demo fixed code produces correct output."""
        fixed = """
def calculate_average(numbers):
    total = 0
    for i in range(len(numbers)):
        total += numbers[i]
    return total / len(numbers)

def find_max_streak(scores):
    max_streak = 0
    current_streak = 0
    for score in scores:
        if score >= 60:
            current_streak += 1
            if current_streak > max_streak:
                max_streak = current_streak
        else:
            current_streak = 0
    return max_streak

scores = [72, 45, 88, 91, 55, 78, 82, 69]
avg = calculate_average(scores)
print(f"Average: {avg:.2f}")
streak = find_max_streak(scores)
print(f"Max passing streak: {streak}")
"""
        trace = execute_python(fixed)
        assert trace.error is None
        assert "72.50" in trace.output
        assert "3" in trace.output

    def test_impact_graph_demo(self):
        """Demo code produces expected graph nodes."""
        code = """
def calculate_average(numbers):
    total = 0
    for i in range(len(numbers) + 1):
        total += numbers[i]
    return total / len(numbers)

scores = [72, 45, 88, 91, 55, 78, 82, 69]
avg = calculate_average(scores)
"""
        graph = analyze_impact(code)
        node_ids = {n.id for n in graph.nodes}
        assert "calculate_average" in node_ids
        assert "var_scores" in node_ids
