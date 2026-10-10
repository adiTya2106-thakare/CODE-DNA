// Core execution types
export interface ExecutionStep {
  line: number;
  event: 'call' | 'line' | 'return' | 'exception';
  variables: Record<string, string>;
  stdout: string;
  functionName: string | null;
  callStack: string[];
  note?: string;
}

export interface ExecutionTrace {
  steps: ExecutionStep[];
  output: string;
  error: string | null;
  executionTime: number;
}

// Bug Autopsy types
export interface BugFinding {
  errorType: string;
  errorMessage: string;
  errorLine: number;
  rootCause: string;
  rootCauseEvidence: string;
  eventSequence: string[];
  suggestedFix: string;
  fixedCode: string;
  verificationResult: string;
  verificationPassed: boolean;
  confidence: 'high' | 'medium' | 'low';
  isVerified: boolean;
}

// What-If types
export interface ComparisonResult {
  originalOutput: string;
  modifiedOutput: string;
  originalError: string | null;
  modifiedError: string | null;
  differences: Difference[];
  behavioralSummary: string;
  boundaryTests: BoundaryTest[];
}

export interface Difference {
  type: 'output' | 'variable' | 'error' | 'behavior';
  description: string;
  original: string;
  modified: string;
  isImprovement: boolean | null;
}

export interface BoundaryTest {
  name: string;
  input: string;
  originalResult: string;
  modifiedResult: string;
  passed: boolean;
}

// Impact Graph types
export interface GraphNode {
  id: string;
  label: string;
  type: 'function' | 'variable' | 'class' | 'module' | 'import';
  defined_at?: number;
  calls?: string[];
  source?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'calls' | 'assigns' | 'imports' | 'defines' | 'uses';
  isRuntime?: boolean;
}

export interface ImpactGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Learning DNA types
export interface LearningQuestion {
  id: string;
  code: string;
  question: string;
  correctAnswer: string;
  concept: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hints: string[];
  misconceptions: Misconception[];
  followUp: string;
}

export interface Misconception {
  trigger: string;
  explanation: string;
}

export interface LearningSession {
  questionsAnswered: number;
  correctAnswers: number;
  conceptsEncountered: string[];
  misconceptionsTriggered: string[];
  teachBackAttempts: TeachBackAttempt[];
}

export interface TeachBackAttempt {
  question: string;
  userExplanation: string;
  feedback: string;
  score: number; // 0-100
  timestamp: Date;
}

// AI explanation
export interface AIExplanation {
  summary: string;
  lineByLine: LineExplanation[];
  concepts: string[];
  complexity: string;
  isDemo: boolean;
}

export interface LineExplanation {
  lineNumber: number;
  code: string;
  explanation: string;
}
