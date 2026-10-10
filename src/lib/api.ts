import axios from 'axios';
import type {
  ExecutionTrace,
  BugFinding,
  ComparisonResult,
  ImpactGraph,
  AIExplanation,
} from '../types';
import {
  DEMO_EXECUTION_TRACE,
  DEMO_BUG_FINDING,
  DEMO_COMPARISON,
  DEMO_IMPACT_GRAPH,
  DEMO_CODE_BUGGY,
} from './demoData';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Detect if backend is available
let backendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    await api.get('/health', { timeout: 2000 });
    backendAvailable = true;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

// ─── Execution / Time Machine ───────────────────────────────────────────────

export async function executeCode(code: string): Promise<ExecutionTrace> {
  const available = await checkBackend();
  if (!available) {
    // Demo mode: return pre-recorded trace for the demo code
    await delay(600);
    if (code.trim() === DEMO_CODE_BUGGY.trim()) {
      return DEMO_EXECUTION_TRACE;
    }
    // For other code, return a simple simulated trace
    return simulateTrace(code);
  }
  const { data } = await api.post('/execute', { code, language: 'python' });
  return data;
}

// ─── Bug Autopsy ────────────────────────────────────────────────────────────

export async function analyzeBug(code: string): Promise<BugFinding> {
  const available = await checkBackend();
  if (!available) {
    await delay(1200);
    if (code.trim() === DEMO_CODE_BUGGY.trim()) {
      return DEMO_BUG_FINDING;
    }
    return generateDemoBugFinding(code);
  }
  const { data } = await api.post('/analyze-bug', { code });
  return data;
}

// ─── What-If Comparison ──────────────────────────────────────────────────────

export async function compareCode(
  original: string,
  modified: string
): Promise<ComparisonResult> {
  const available = await checkBackend();
  if (!available) {
    await delay(900);
    return DEMO_COMPARISON;
  }
  const { data } = await api.post('/compare', { original, modified });
  return data;
}

// ─── Impact Graph ────────────────────────────────────────────────────────────

export async function analyzeImpact(code: string): Promise<ImpactGraph> {
  const available = await checkBackend();
  if (!available) {
    await delay(400);
    return DEMO_IMPACT_GRAPH;
  }
  const { data } = await api.post('/impact-graph', { code });
  return data;
}

// ─── AI Explanation ──────────────────────────────────────────────────────────

export async function explainCode(code: string): Promise<AIExplanation> {
  const available = await checkBackend();
  if (!available) {
    await delay(800);
    return generateDemoExplanation(code);
  }
  const { data } = await api.post('/explain', { code });
  return data;
}

// ─── Learning ────────────────────────────────────────────────────────────────

export async function evaluateTeachBack(
  code: string,
  userExplanation: string
): Promise<{ score: number; feedback: string }> {
  const available = await checkBackend();
  if (!available) {
    await delay(1000);
    return evaluateTeachBackDemo(userExplanation);
  }
  const { data } = await api.post('/evaluate-teach-back', { code, user_explanation: userExplanation });
  return data;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simulateTrace(code: string): ExecutionTrace {
  const lines = code.split('\n');
  const steps = lines.slice(0, Math.min(lines.length, 20)).map((line, i) => ({
    line: i + 1,
    event: 'line' as const,
    variables: {},
    stdout: '',
    functionName: '<module>',
    callStack: ['<module>'],
    note: `Executing line ${i + 1}: ${line.trim().substring(0, 60)}`,
  }));

  // Add a simple output step
  const printLines = lines.filter((l) => l.trim().startsWith('print('));
  const output = printLines.map((l) => `[output of: ${l.trim()}]`).join('\n');

  return {
    steps,
    output: output || '(no output)',
    error: null,
    executionTime: 5,
  };
}

function generateDemoBugFinding(code: string): BugFinding {
  const lines = code.split('\n');
  const bugLine = lines.findIndex((l) => l.includes('range(') && l.includes('+')) + 1;
  
  return {
    errorType: 'Potential IndexError',
    errorMessage: 'Possible off-by-one in range() call',
    errorLine: bugLine > 0 ? bugLine : 1,
    rootCause: 'Demo mode: Static analysis detected a potential off-by-one pattern. Run with backend for full AI analysis.',
    rootCauseEvidence: bugLine > 0 ? `Line ${bugLine}: range() call with +1 may exceed list bounds` : 'No specific pattern detected in demo mode.',
    eventSequence: ['Code submitted for analysis', 'Static pattern matching performed', 'Demo finding generated'],
    suggestedFix: 'Review range() boundaries. Ensure indices stay within 0 to len(list)-1.',
    fixedCode: code.replace(/range\(len\((\w+)\)\s*\+\s*1\)/g, 'range(len($1))'),
    verificationResult: 'Demo mode: verification not available without backend.',
    verificationPassed: false,
    confidence: 'low',
    isVerified: false,
  };
}

function generateDemoExplanation(code: string): AIExplanation {
  const lines = code.split('\n').filter((l) => l.trim());
  return {
    summary: '⚠️ Demo Mode: AI backend not connected. This is a pattern-based explanation. Connect the FastAPI backend with an LLM key for full AI-powered insights.',
    lineByLine: lines.slice(0, 10).map((line, i) => ({
      lineNumber: i + 1,
      code: line,
      explanation: line.trim().startsWith('#')
        ? 'Comment: ' + line.trim().slice(1).trim()
        : line.trim().startsWith('def ')
        ? 'Function definition: ' + line.trim().slice(4, line.indexOf('(')) + '()'
        : line.trim().startsWith('for ')
        ? 'Loop statement iterating over a sequence'
        : line.trim().startsWith('if ')
        ? 'Conditional branch'
        : line.trim().startsWith('return ')
        ? 'Returns a value from the function'
        : line.trim().startsWith('print(')
        ? 'Outputs text to the console'
        : 'Statement executing Python code',
    })),
    concepts: ['Python basics', 'Control flow', 'Functions'],
    complexity: 'O(n)',
    isDemo: true,
  };
}

function evaluateTeachBackDemo(explanation: string): { score: number; feedback: string } {
  const words = explanation.trim().split(/\s+/).length;
  const hasKeyTerms = ['index', 'range', 'list', 'loop', 'error', 'bug', 'off', 'bound'].some(
    (term) => explanation.toLowerCase().includes(term)
  );

  const score = Math.min(100, words * 2 + (hasKeyTerms ? 30 : 0));

  if (score >= 70) {
    return {
      score,
      feedback:
        '✅ Good explanation! You identified the core issue. To strengthen it: mention *why* `range(n+1)` causes the problem (it generates index `n` for a list whose last valid index is `n-1`), and note that the fix is as simple as removing the `+1`.',
    };
  } else if (score >= 40) {
    return {
      score,
      feedback:
        '🟡 Partial explanation. You have the right direction, but try to be more specific: *which line* causes the error? *What does range(len(numbers)+1) actually produce?* Tracing through the code step-by-step will help.',
    };
  } else {
    return {
      score,
      feedback:
        '💡 Keep trying! Start by asking: how many iterations does `range(len(numbers)+1)` produce? Then check: does the list have that many elements? The gap between those two answers reveals the bug.',
    };
  }
}

export { checkBackend };
