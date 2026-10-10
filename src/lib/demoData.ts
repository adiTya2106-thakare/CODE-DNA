// Demo data for CODE DNA — realistic off-by-one bug project
import type { ExecutionTrace, BugFinding, ComparisonResult, ImpactGraph, LearningQuestion } from '../types';

export const DEMO_CODE_BUGGY = `def calculate_average(numbers):
    """Calculate the average of a list of numbers."""
    total = 0
    for i in range(len(numbers) + 1):  # Bug: off-by-one error
        total += numbers[i]
    return total / len(numbers)

def find_max_streak(scores):
    """Find the longest streak of passing scores (>= 60)."""
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

# Demo execution
scores = [72, 45, 88, 91, 55, 78, 82, 69]
avg = calculate_average(scores)
print(f"Average: {avg:.2f}")
streak = find_max_streak(scores)
print(f"Max passing streak: {streak}")
`;

export const DEMO_CODE_FIXED = `def calculate_average(numbers):
    """Calculate the average of a list of numbers."""
    total = 0
    for i in range(len(numbers)):  # Fixed: removed + 1
        total += numbers[i]
    return total / len(numbers)

def find_max_streak(scores):
    """Find the longest streak of passing scores (>= 60)."""
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

# Demo execution
scores = [72, 45, 88, 91, 55, 78, 82, 69]
avg = calculate_average(scores)
print(f"Average: {avg:.2f}")
streak = find_max_streak(scores)
print(f"Max passing streak: {streak}")
`;

export const DEMO_EXECUTION_TRACE: ExecutionTrace = {
  steps: [
    { line: 1, event: 'call', variables: {}, stdout: '', functionName: '<module>', callStack: ['<module>'], note: 'Script starts, defining function calculate_average' },
    { line: 23, event: 'line', variables: {}, stdout: '', functionName: '<module>', callStack: ['<module>'], note: 'Defining scores list' },
    { line: 23, event: 'line', variables: { scores: '[72, 45, 88, 91, 55, 78, 82, 69]' }, stdout: '', functionName: '<module>', callStack: ['<module>'], note: 'scores assigned with 8 elements' },
    { line: 24, event: 'line', variables: { scores: '[72, 45, 88, 91, 55, 78, 82, 69]' }, stdout: '', functionName: '<module>', callStack: ['<module>'], note: 'Calling calculate_average(scores)' },
    { line: 1, event: 'call', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'Entering calculate_average, numbers has 8 items' },
    { line: 3, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '0' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'total = 0 initialized' },
    { line: 4, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '0', i: '0' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: '⚠️ range(len(numbers)+1) = range(9), but list has only 8 items (indices 0-7)!' },
    { line: 5, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '72', i: '0' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'total += numbers[0] = 72, total is now 72' },
    { line: 4, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '72', i: '1' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'Loop continues, i=1' },
    { line: 5, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '117', i: '1' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'total += 45 = 117' },
    { line: 4, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '117', i: '2' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'Loop continues, i=2' },
    { line: 5, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '205', i: '2' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'total += 88 = 205' },
    { line: 4, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '205', i: '7' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'i=7, last valid index' },
    { line: 5, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '580', i: '7' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'total += 69 = 580, all valid items summed' },
    { line: 4, event: 'line', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '580', i: '8' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: '💥 i=8 — this is OUT OF BOUNDS! numbers only has indices 0-7' },
    { line: 5, event: 'exception', variables: { numbers: '[72, 45, 88, 91, 55, 78, 82, 69]', total: '580', i: '8' }, stdout: '', functionName: 'calculate_average', callStack: ['<module>', 'calculate_average'], note: 'IndexError: list index out of range — numbers[8] does not exist!' },
  ],
  output: '',
  error: 'IndexError: list index out of range\n  File "script.py", line 5, in calculate_average\n    total += numbers[i]\nIndexError: list index out of range',
  executionTime: 12,
};

export const DEMO_BUG_FINDING: BugFinding = {
  errorType: 'IndexError',
  errorMessage: 'list index out of range',
  errorLine: 5,
  rootCause: 'Off-by-one error in range() call — `range(len(numbers) + 1)` generates indices 0 through 8 for a list of 8 elements, but the last valid index is 7.',
  rootCauseEvidence: 'Line 4: `for i in range(len(numbers) + 1)` — len([72,45,88,91,55,78,82,69]) = 8, so range(9) = [0,1,2,3,4,5,6,7,8]. The 9th iteration attempts numbers[8] which does not exist.',
  eventSequence: [
    'calculate_average() called with 8-element list',
    'range(len(numbers) + 1) evaluates to range(9), producing 9 iterations',
    'Iterations i=0 through i=7 succeed, accumulating total=580',
    'Iteration i=8: numbers[8] accessed on a list with max index 7',
    'Python raises IndexError: list index out of range',
    'Program terminates — find_max_streak() never executes',
  ],
  suggestedFix: 'Change `range(len(numbers) + 1)` to `range(len(numbers))` on line 4. Even better: use `sum(numbers)` directly.',
  fixedCode: DEMO_CODE_FIXED,
  verificationResult: 'Fixed code executes successfully. calculate_average([72,45,88,91,55,78,82,69]) returns 72.5 ✓. find_max_streak returns 3 ✓.',
  verificationPassed: true,
  confidence: 'high',
  isVerified: true,
};

export const DEMO_COMPARISON: ComparisonResult = {
  originalOutput: 'IndexError: list index out of range\n  File "script.py", line 5, in calculate_average',
  modifiedOutput: 'Average: 72.50\nMax passing streak: 3',
  originalError: 'IndexError: list index out of range',
  modifiedError: null,
  differences: [
    {
      type: 'error',
      description: 'Error eliminated',
      original: 'IndexError: list index out of range at line 5',
      modified: 'No errors — program completes successfully',
      isImprovement: true,
    },
    {
      type: 'output',
      description: 'Output produced',
      original: '(no output — crash before any print)',
      modified: 'Average: 72.50\nMax passing streak: 3',
      isImprovement: true,
    },
    {
      type: 'behavior',
      description: 'Range boundary',
      original: 'range(9) iterates indices 0–8 for 8-element list',
      modified: 'range(8) iterates indices 0–7 matching list length',
      isImprovement: true,
    },
  ],
  behavioralSummary: 'The original code crashes with an IndexError before producing any output. The fix changes range(len(numbers)+1) to range(len(numbers)), eliminating the out-of-bounds access. The corrected program computes the average (72.5) and finds the max streak of passing scores (3).',
  boundaryTests: [
    { name: 'Empty list', input: '[]', originalResult: 'ZeroDivisionError', modifiedResult: 'ZeroDivisionError', passed: false },
    { name: 'Single element', input: '[85]', originalResult: 'IndexError (index 1 out of range)', modifiedResult: '85.0 ✓', passed: true },
    { name: 'All failing', input: '[10, 20, 30]', originalResult: 'IndexError', modifiedResult: '20.0, streak=0 ✓', passed: true },
    { name: '8 elements', input: '[72,45,88,91,55,78,82,69]', originalResult: 'IndexError', modifiedResult: '72.5, streak=3 ✓', passed: true },
  ],
};

export const DEMO_IMPACT_GRAPH: ImpactGraph = {
  nodes: [
    { id: 'calculate_average', label: 'calculate_average()', type: 'function', defined_at: 1, source: 'demo.py' },
    { id: 'find_max_streak', label: 'find_max_streak()', type: 'function', defined_at: 8, source: 'demo.py' },
    { id: 'var_scores', label: 'scores', type: 'variable', source: 'demo.py' },
    { id: 'var_avg', label: 'avg', type: 'variable', source: 'demo.py' },
    { id: 'var_streak', label: 'streak', type: 'variable', source: 'demo.py' },
    { id: 'builtin_range', label: 'range()', type: 'import', source: 'builtins' },
    { id: 'builtin_len', label: 'len()', type: 'import', source: 'builtins' },
    { id: 'builtin_print', label: 'print()', type: 'import', source: 'builtins' },
  ],
  edges: [
    { source: 'calculate_average', target: 'builtin_range', type: 'calls' },
    { source: 'calculate_average', target: 'builtin_len', type: 'calls' },
    { source: 'find_max_streak', target: 'builtin_len', type: 'calls' },
    { source: 'var_scores', target: 'calculate_average', type: 'uses' },
    { source: 'var_scores', target: 'find_max_streak', type: 'uses' },
    { source: 'calculate_average', target: 'var_avg', type: 'assigns' },
    { source: 'find_max_streak', target: 'var_streak', type: 'assigns' },
    { source: 'var_avg', target: 'builtin_print', type: 'uses' },
    { source: 'var_streak', target: 'builtin_print', type: 'uses' },
  ],
};

export const DEMO_LEARNING_QUESTION: LearningQuestion = {
  id: 'demo-q1',
  code: `numbers = [10, 20, 30]
for i in range(len(numbers) + 1):
    print(numbers[i])`,
  question: 'What will happen when this code runs? Predict the output or error.',
  correctAnswer: 'The code will print 10, 20, 30 on separate lines, then raise an IndexError on the 4th iteration because range(4) produces index 3, which does not exist in a 3-element list.',
  concept: 'off-by-one error / list indexing',
  difficulty: 'beginner',
  hints: [
    'How many elements are in the list numbers?',
    'What does range(len(numbers) + 1) evaluate to when len(numbers) is 3?',
    'What is the last valid index for a list of 3 elements?',
  ],
  misconceptions: [
    { trigger: 'no error', explanation: 'range(len(numbers)+1) generates one extra index beyond the list end, causing an IndexError on the final iteration.' },
    { trigger: 'prints nothing', explanation: 'The first three iterations (i=0,1,2) succeed before the crash on i=3.' },
    { trigger: 'range is correct', explanation: 'range(n+1) produces n+1 values: 0 through n. For a list of n elements, valid indices are 0 through n-1.' },
  ],
  followUp: 'How would you fix this code to print all elements safely? What are two different approaches?',
};

export const SAMPLE_PROJECTS = [
  {
    id: 'off-by-one',
    name: '🐛 Off-by-One Bug',
    description: 'Classic IndexError from range() miscalculation',
    code: DEMO_CODE_BUGGY,
    difficulty: 'beginner',
  },
  {
    id: 'fibonacci',
    name: '🔢 Fibonacci Sequence',
    description: 'Recursive vs iterative implementation',
    code: `def fibonacci_recursive(n):
    """Return nth Fibonacci number recursively."""
    if n <= 1:
        return n
    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2)

def fibonacci_iterative(n):
    """Return nth Fibonacci number iteratively."""
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

# Compare both approaches
for i in range(8):
    r = fibonacci_recursive(i)
    it = fibonacci_iterative(i)
    print(f"fib({i}): recursive={r}, iterative={it}, match={r==it}")
`,
    difficulty: 'beginner',
  },
  {
    id: 'binary-search',
    name: '🔍 Binary Search',
    description: 'Classic search algorithm with edge cases',
    code: `def binary_search(arr, target):
    """Find target in sorted array, return index or -1."""
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Test cases
sorted_list = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]
tests = [23, 1, 91, 50, 2]

for val in tests:
    idx = binary_search(sorted_list, val)
    if idx != -1:
        print(f"Found {val} at index {idx}")
    else:
        print(f"{val} not found in list")
`,
    difficulty: 'intermediate',
  },
  {
    id: 'stack-class',
    name: '📚 Stack Data Structure',
    description: 'OOP implementation with edge case handling',
    code: `class Stack:
    def __init__(self):
        self.items = []
    
    def push(self, item):
        self.items.append(item)
    
    def pop(self):
        if self.is_empty():
            raise IndexError("Stack is empty")
        return self.items.pop()
    
    def peek(self):
        if self.is_empty():
            raise IndexError("Stack is empty")
        return self.items[-1]
    
    def is_empty(self):
        return len(self.items) == 0
    
    def size(self):
        return len(self.items)

# Demonstrate usage
s = Stack()
print("Empty?", s.is_empty())
s.push(10)
s.push(20)
s.push(30)
print("Top:", s.peek())
print("Size:", s.size())
print("Pop:", s.pop())
print("Pop:", s.pop())
print("Size after pops:", s.size())
`,
    difficulty: 'intermediate',
  },
];
