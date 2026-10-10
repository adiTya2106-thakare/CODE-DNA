"""
CODE DNA — Python execution tracer using sys.settrace
Records step-by-step variable states from real code execution.
"""
import sys
import io
import copy
import traceback
import threading
from typing import Any
from dataclasses import dataclass, field


@dataclass
class ExecutionStep:
    line: int
    event: str
    variables: dict
    stdout: str
    function_name: str | None
    call_stack: list[str]
    note: str = ""


@dataclass
class ExecutionTrace:
    steps: list[ExecutionStep] = field(default_factory=list)
    output: str = ""
    error: str | None = None
    execution_time_ms: int = 0


MAX_STEPS = 200
MAX_STRING_LEN = 80
TIMEOUT_SECONDS = 5


def _safe_repr(value: Any) -> str:
    """Safely represent a variable value, truncating if too long."""
    try:
        r = repr(value)
        if len(r) > MAX_STRING_LEN:
            return r[:MAX_STRING_LEN] + "…"
        return r
    except Exception:
        return "<unrepresentable>"


def _safe_vars(frame_locals: dict) -> dict:
    """Extract safe variable representations from frame locals."""
    skip = {"__builtins__", "__doc__", "__name__", "__package__", "__spec__", "__loader__"}
    return {
        k: _safe_repr(v)
        for k, v in frame_locals.items()
        if not k.startswith("__") and k not in skip
    }


class Tracer:
    def __init__(self):
        self.steps: list[ExecutionStep] = []
        self.stdout_buffer = io.StringIO()
        self.call_stack: list[str] = []
        self._step_count = 0

    def trace_calls(self, frame, event, arg):
        if self._step_count >= MAX_STEPS:
            return None

        # Skip internal frames
        filename = frame.f_code.co_filename
        if filename.startswith("<") and filename != "<string>":
            return self.trace_calls

        func_name = frame.f_code.co_name

        if event == "call":
            self.call_stack.append(func_name)
        elif event in ("return", "exception"):
            if self.call_stack and self.call_stack[-1] == func_name:
                pass  # Keep stack for display, pop on next call

        current_vars = _safe_vars(frame.f_locals)
        current_stdout = self.stdout_buffer.getvalue()

        step = ExecutionStep(
            line=frame.f_lineno,
            event=event,
            variables=copy.deepcopy(current_vars),
            stdout=current_stdout,
            function_name=func_name if func_name != "<module>" else None,
            call_stack=list(self.call_stack),
        )
        self.steps.append(step)
        self._step_count += 1

        if event == "return" and len(self.call_stack) > 1:
            self.call_stack.pop()

        return self.trace_calls


def execute_python(code: str) -> ExecutionTrace:
    """
    Execute Python code safely with tracing.
    Returns an ExecutionTrace with step-by-step variable states.
    """
    tracer = Tracer()
    result = ExecutionTrace()

    import time
    start = time.perf_counter()

    # Capture stdout
    old_stdout = sys.stdout
    sys.stdout = tracer.stdout_buffer

    try:
        # Compile first to catch syntax errors
        compiled = compile(code, "<string>", "exec")

        # Restricted globals — no file I/O, no os, no subprocess
        safe_globals = {
            "__builtins__": {
                "print": print,
                "range": range,
                "len": len,
                "int": int,
                "float": float,
                "str": str,
                "bool": bool,
                "list": list,
                "dict": dict,
                "tuple": tuple,
                "set": set,
                "type": type,
                "isinstance": isinstance,
                "enumerate": enumerate,
                "zip": zip,
                "map": map,
                "filter": filter,
                "sorted": sorted,
                "reversed": reversed,
                "sum": sum,
                "min": min,
                "max": max,
                "abs": abs,
                "round": round,
                "input": lambda _="": "",  # no-op input
                "repr": repr,
                "hasattr": hasattr,
                "getattr": getattr,
                "setattr": setattr,
                "Exception": Exception,
                "ValueError": ValueError,
                "TypeError": TypeError,
                "IndexError": IndexError,
                "KeyError": KeyError,
                "AttributeError": AttributeError,
                "StopIteration": StopIteration,
                "ZeroDivisionError": ZeroDivisionError,
                "RuntimeError": RuntimeError,
                "NotImplementedError": NotImplementedError,
                "NameError": NameError,
                "AssertionError": AssertionError,
                "True": True,
                "False": False,
                "None": None,
            }
        }

        # Set up tracer
        sys.settrace(tracer.trace_calls)

        exec(compiled, safe_globals)

    except Exception as e:
        result.error = traceback.format_exc(limit=5)

        # Add exception step
        tracer.steps.append(ExecutionStep(
            line=getattr(e, "__traceback__", None) and e.__traceback__.tb_lineno or 0,
            event="exception",
            variables={},
            stdout=tracer.stdout_buffer.getvalue(),
            function_name=None,
            call_stack=tracer.call_stack[:],
            note=f"{type(e).__name__}: {e}",
        ))
    finally:
        sys.settrace(None)
        sys.stdout = old_stdout

    elapsed = int((time.perf_counter() - start) * 1000)

    result.steps = tracer.steps
    result.output = tracer.stdout_buffer.getvalue()
    result.execution_time_ms = elapsed

    return result
