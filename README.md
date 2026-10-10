# CODE DNA — Interactive Code Intelligence and Learning Lab

> **Don't trust the explanation. Investigate the evidence.**

CODE DNA is a full-stack application that helps beginners understand complex code and helps developers debug unfamiliar projects. Every AI explanation is connected to observable execution traces, variable states, and test results — not generated in isolation.

---

## Features

| Feature | What it does |
|---|---|
| **Code Time Machine** | Step through Python execution line by line with real `sys.settrace` traces. See variable states, call stack, and stdout at every step. |
| **Bug Autopsy** | Dissect bugs with root cause, event sequence, and a verified fix. Facts are clearly labeled as `VERIFIED` or `HYPOTHESIS`. |
| **What-If Simulator** | Side-by-side comparison of original vs modified code with real execution results and boundary-case tests. |
| **Code Impact Graph** | Interactive D3 visualization of functions, variables, and dependencies inferred from AST analysis. |
| **Personal Learning DNA** | Predict → Hint → Reveal → Teach-Back cycle with misconception detection and adaptive feedback. |

---

## Demo in 2 Minutes (No Account Required)

The pre-loaded demo is a realistic **off-by-one bug**: `range(len(numbers) + 1)` in a grade-averaging function.

1. **Time Machine** → Click "Record Execution" → step through to see `i=8` crash a list with max index 7
2. **Bug Autopsy** → Click "Run Autopsy" → see root cause with evidence + verified fix
3. **What-If** → Click "Compare Both Versions" → see exact diffs between buggy and fixed code
4. **Learning** → Make a prediction → use hints → attempt Teach-Back
5. **Impact Graph** → Click "Rebuild Graph" → select `calculate_average()` node

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (v4, CSS-first config)
- **Monaco Editor** (same engine as VS Code)
- **D3.js** for the Impact Graph
- **Zustand** for state management
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **FastAPI** + **Uvicorn**
- **Python `sys.settrace`** for real step-by-step execution recording
- **Python `ast` module** for static dependency analysis
- **OpenAI API** (optional) for AI explanations and teach-back evaluation

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+

### Frontend

```bash
cd code-dna
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Backend (optional — required for live execution)

```bash
cd code-dna/backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Optionally add OPENAI_API_KEY= to .env for AI features
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`

> **Demo Mode**: If the backend is not running, the frontend automatically uses pre-recorded demo data — clearly labeled with an amber "DEMO MODE" banner. All UI interactions remain functional.

### With LLM (optional)

Add your OpenAI API key to `backend/.env`:

```
OPENAI_API_KEY=sk-...
```

This enables:
- Full AI-powered code explanations
- LLM-powered bug analysis with precise root causes
- Teach-Back evaluation with detailed, code-grounded feedback

---

## Project Structure

```
code-dna/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx          # Landing page with interactive demo
│   │   ├── CodeLab.tsx          # Code editor + AI explanation
│   │   ├── TimeMachine.tsx      # Step-through execution viewer
│   │   ├── BugAutopsy.tsx       # Bug analysis + verified fixes
│   │   ├── WhatIf.tsx           # Side-by-side code comparison
│   │   ├── ImpactGraph.tsx      # D3 dependency visualization
│   │   ├── Learning.tsx         # Predict → Teach-Back cycle
│   │   └── DNADashboard.tsx     # Personal learning profile
│   ├── components/
│   │   ├── Navbar.tsx           # Navigation
│   │   ├── CodeEditor.tsx       # Monaco editor wrapper
│   │   └── ui.tsx               # Shared UI components
│   ├── lib/
│   │   ├── api.ts               # API client with demo fallbacks
│   │   ├── store.ts             # Zustand global state
│   │   └── demoData.ts          # Pre-recorded demo traces
│   └── types/
│       └── index.ts             # TypeScript interfaces
├── backend/
│   ├── main.py                  # FastAPI routes
│   ├── tracer.py                # sys.settrace execution recorder
│   ├── analyzer.py              # AST static analysis
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

---

## Security

- **No arbitrary file system access** — the Python sandbox uses a restricted `__builtins__` dict
- **No subprocess/os/socket** — these modules are excluded from the sandbox
- **API keys never reach the browser** — all LLM calls go through the FastAPI backend
- **Timeout protection** — execution is limited (configurable in `tracer.py`)
- **User code disclosure** — submitting code to the backend sends it to our server. If an LLM key is configured, code is also sent to that LLM provider.

---

## Tests

```bash
# Backend tests
cd code-dna/backend
python -m pytest tests/ -v

# Frontend type check
cd code-dna
npm run build   # includes tsc -b
```

---

## Limitations

- **Python only** — JavaScript, Java, and other languages show an unsupported message
- **No persistent storage** — learning session data is in-memory (lost on refresh)
- **Execution sandbox** — some Python features (file I/O, networking, `subprocess`) are intentionally blocked
- **LLM optional** — all core features work without an API key in demo mode

---

## Architecture Decision: Why Real Execution?

Most code explanation tools generate text descriptions independently of the actual code behavior. CODE DNA's differentiator is that **every explanation is grounded in observable evidence**:

- The Time Machine uses `sys.settrace` — the same mechanism Python debuggers use
- Bug Autopsy verifies fixes by actually running the patched code
- What-If comparisons run both versions and compare real outputs
- The Impact Graph is built from Python's `ast` module, not hand-authored descriptions
- Teach-Back scoring can reference actual line numbers and variable names

This means users can challenge and verify every claim the tool makes.
