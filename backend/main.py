"""
CODE DNA — FastAPI backend
Provides real Python execution, tracing, and AI-powered analysis.
"""
import os
import textwrap
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from tracer import execute_python, ExecutionTrace
from analyzer import analyze_impact, detect_bug_patterns

load_dotenv()

app = FastAPI(title="CODE DNA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LLM_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
LLM_AVAILABLE = bool(LLM_KEY)


# ─── Request/Response Models ─────────────────────────────────────────────────

class CodeRequest(BaseModel):
    code: str
    language: str = "python"

class CompareRequest(BaseModel):
    original: str
    modified: str

class TeachBackRequest(BaseModel):
    code: str
    user_explanation: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

def trace_to_dict(trace: ExecutionTrace) -> dict:
    return {
        "steps": [
            {
                "line": s.line,
                "event": s.event,
                "variables": s.variables,
                "stdout": s.stdout,
                "functionName": s.function_name,
                "callStack": s.call_stack,
                "note": s.note,
            }
            for s in trace.steps
        ],
        "output": trace.output,
        "error": trace.error,
        "executionTime": trace.execution_time_ms,
    }


async def call_llm(prompt: str, system: str = "You are an expert Python tutor. Be concise and precise.") -> str:
    """Call LLM if available, otherwise return a fallback message."""
    if not LLM_AVAILABLE:
        return "[LLM not available — set OPENAI_API_KEY in .env]"

    import httpx
    headers = {"Authorization": f"Bearer {LLM_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 1000,
        "temperature": 0.3,
    }
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "llm_available": LLM_AVAILABLE}


@app.post("/api/execute")
async def execute_code(req: CodeRequest):
    if req.language != "python":
        raise HTTPException(400, "Only Python execution is supported in this environment.")
    if len(req.code) > 10_000:
        raise HTTPException(400, "Code too long (max 10,000 characters).")
    trace = execute_python(req.code)
    return trace_to_dict(trace)


@app.post("/api/analyze-bug")
async def analyze_bug(req: CodeRequest):
    # Step 1: Execute to get error
    trace = execute_python(req.code)
    error_output = trace.error

    # Step 2: Static analysis
    static_findings = detect_bug_patterns(req.code, error_output)

    # Step 3: Try LLM for richer analysis
    if LLM_AVAILABLE and error_output:
        prompt = f"""Analyze this Python code and its error. Return JSON with these exact keys:
errorType, errorMessage, errorLine (int), rootCause, rootCauseEvidence, eventSequence (list of strings), 
suggestedFix, fixedCode, verificationResult, verificationPassed (bool), confidence (high/medium/low), isVerified (bool).

Code:
```python
{req.code}
```

Error:
{error_output}

Static analysis findings: {static_findings}

Return only valid JSON, no markdown."""
        try:
            import json
            llm_resp = await call_llm(prompt)
            result = json.loads(llm_resp)
            return result
        except Exception:
            pass

    # Step 4: Fallback — pattern-based analysis
    lines = req.code.split("\n")
    error_line = 0
    if error_output:
        for line in error_output.split("\n"):
            if "line " in line:
                try:
                    error_line = int(line.split("line ")[-1].strip().rstrip(","))
                    break
                except ValueError:
                    pass

    # Find the most confident pattern
    patterns = static_findings.get("patterns", [])
    primary = patterns[0] if patterns else {"type": "Unknown", "description": "No pattern detected", "line": error_line, "confidence": "low"}

    # Attempt fix for off-by-one
    fixed_code = req.code
    if primary.get("type") == "OffByOne":
        import re
        fixed_code = re.sub(r"range\(len\((\w+)\)\s*\+\s*1\)", r"range(len(\1))", req.code)

    # Verify fix
    fixed_trace = execute_python(fixed_code)
    fix_passed = fixed_trace.error is None

    return {
        "errorType": error_output.split("\n")[-2].split(":")[0].strip() if error_output else primary["type"],
        "errorMessage": error_output.split("\n")[-2].split(":", 1)[-1].strip() if error_output else primary["description"],
        "errorLine": primary.get("line", error_line),
        "rootCause": primary["description"],
        "rootCauseEvidence": f"Line {primary.get('line', '?')}: {lines[primary.get('line', 1) - 1].strip() if primary.get('line') else 'N/A'}",
        "eventSequence": [
            "Code submitted for execution",
            f"Execution reaches line {primary.get('line', '?')}",
            f"Pattern detected: {primary['type']}",
            error_output.split("\n")[-2] if error_output else "No error detected",
        ],
        "suggestedFix": f"Static analysis detected: {primary['description']}. Connect an LLM for a more detailed fix.",
        "fixedCode": fixed_code,
        "verificationResult": f"Fixed code {'executes successfully' if fix_passed else 'still has errors'}. Output: {fixed_trace.output[:200] if fix_passed else fixed_trace.error[:200] if fixed_trace.error else 'N/A'}",
        "verificationPassed": fix_passed,
        "confidence": primary.get("confidence", "low"),
        "isVerified": fix_passed,
    }


@app.post("/api/compare")
async def compare_code(req: CompareRequest):
    orig_trace = execute_python(req.original)
    mod_trace = execute_python(req.modified)

    differences = []

    # Error difference
    if orig_trace.error and not mod_trace.error:
        differences.append({
            "type": "error",
            "description": "Error eliminated",
            "original": orig_trace.error.split("\n")[-2] if orig_trace.error else "no error",
            "modified": "No error — program completes successfully",
            "isImprovement": True,
        })
    elif not orig_trace.error and mod_trace.error:
        differences.append({
            "type": "error",
            "description": "New error introduced",
            "original": "No error",
            "modified": mod_trace.error.split("\n")[-2] if mod_trace.error else "unknown error",
            "isImprovement": False,
        })

    # Output difference
    if orig_trace.output != mod_trace.output:
        differences.append({
            "type": "output",
            "description": "Output changed",
            "original": orig_trace.output or "(no output)",
            "modified": mod_trace.output or "(no output)",
            "isImprovement": bool(mod_trace.output and not orig_trace.output),
        })

    # Build behavioral summary
    if LLM_AVAILABLE:
        prompt = f"""Compare these two Python programs and their outputs. Write 2-3 sentences explaining the key behavioral difference.

Original output/error: {orig_trace.output or orig_trace.error or 'none'}
Modified output/error: {mod_trace.output or mod_trace.error or 'none'}

Differences: {differences}

Be specific about what changed and why it matters."""
        try:
            summary = await call_llm(prompt)
        except Exception:
            summary = f"Original: {'error' if orig_trace.error else 'success'}. Modified: {'error' if mod_trace.error else 'success'}."
    else:
        summary = (
            f"Original program {'raised ' + orig_trace.error.split(chr(10))[-2] if orig_trace.error else 'ran successfully'}. "
            f"Modified program {'raised ' + mod_trace.error.split(chr(10))[-2] if mod_trace.error else 'ran successfully with output: ' + (mod_trace.output[:100] if mod_trace.output else 'none')}."
        )

    # Simple boundary tests
    boundary_tests = []
    if "numbers" in req.original or "scores" in req.original:
        tests = [
            ("Empty list", "[]"),
            ("Single element", "[42]"),
            ("Two elements", "[10, 20]"),
        ]
        for name, input_val in tests:
            t_orig = execute_python(req.original.replace("[72, 45, 88, 91, 55, 78, 82, 69]", input_val))
            t_mod = execute_python(req.modified.replace("[72, 45, 88, 91, 55, 78, 82, 69]", input_val))
            boundary_tests.append({
                "name": name,
                "input": input_val,
                "originalResult": t_orig.error.split("\n")[-2] if t_orig.error else (t_orig.output[:50] or "ok"),
                "modifiedResult": t_mod.error.split("\n")[-2] if t_mod.error else (t_mod.output[:50] or "ok"),
                "passed": not t_mod.error,
            })

    return {
        "originalOutput": orig_trace.output or "",
        "modifiedOutput": mod_trace.output or "",
        "originalError": orig_trace.error,
        "modifiedError": mod_trace.error,
        "differences": differences,
        "behavioralSummary": summary,
        "boundaryTests": boundary_tests,
    }


@app.post("/api/impact-graph")
async def impact_graph(req: CodeRequest):
    graph = analyze_impact(req.code)
    return {
        "nodes": [
            {
                "id": n.id, "label": n.label, "type": n.type,
                "defined_at": n.defined_at, "source": n.source,
            }
            for n in graph.nodes
        ],
        "edges": [
            {"source": e.source, "target": e.target, "type": e.type, "isRuntime": e.is_runtime}
            for e in graph.edges
        ],
    }


@app.post("/api/explain")
async def explain_code(req: CodeRequest):
    if LLM_AVAILABLE:
        prompt = f"""Explain this Python code. Return JSON with keys:
summary (string), lineByLine (array of {{lineNumber, code, explanation}}), 
concepts (array of strings), complexity (string like "O(n)"), isDemo (false).

Code:
```python
{req.code}
```
Return only valid JSON."""
        try:
            import json
            llm_resp = await call_llm(prompt)
            result = json.loads(llm_resp)
            result["isDemo"] = False
            return result
        except Exception:
            pass

    # Fallback
    lines = req.code.split("\n")
    return {
        "summary": "Backend connected but LLM not configured. Set OPENAI_API_KEY for AI explanations.",
        "lineByLine": [
            {"lineNumber": i + 1, "code": line, "explanation": f"Line {i+1}"}
            for i, line in enumerate(lines[:10])
        ],
        "concepts": ["Python"],
        "complexity": "O(?)",
        "isDemo": True,
    }


@app.post("/api/evaluate-teach-back")
async def evaluate_teach_back(req: TeachBackRequest):
    if LLM_AVAILABLE:
        prompt = f"""A student is explaining this code:

```python
{req.code}
```

Student's explanation: "{req.user_explanation}"

Evaluate their explanation 0-100. Return JSON: {{score: int, feedback: string}}.
Feedback should be 2-3 sentences, reference specific code details, and suggest improvement."""
        try:
            import json
            llm_resp = await call_llm(prompt)
            return json.loads(llm_resp)
        except Exception:
            pass

    # Fallback evaluation
    words = req.user_explanation.strip().split()
    key_terms = ["index", "range", "list", "loop", "error", "bug", "off", "bound"]
    has_terms = any(t in req.user_explanation.lower() for t in key_terms)
    score = min(100, len(words) * 2 + (30 if has_terms else 0))

    if score >= 70:
        feedback = "Good explanation! You identified key concepts. For full marks, reference specific line numbers and variable names from the code."
    elif score >= 40:
        feedback = "Partial explanation. Try to be more specific: which exact line causes the issue and what value does the problematic variable hold?"
    else:
        feedback = "Keep going! Start by identifying the error type and which line triggers it. Then trace backward to find why."

    return {"score": score, "feedback": feedback}
