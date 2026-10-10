import { useState } from 'react';
import { Play, Code, Lightbulb, RefreshCw } from 'lucide-react';
import { CodeEditor } from '../components/CodeEditor';
import { LoadingSpinner, ErrorBanner, DemoBanner, PageHeader } from '../components/ui';
import { executeCode, explainCode } from '../lib/api';
import { useAppStore } from '../lib/store';
import { SAMPLE_PROJECTS } from '../lib/demoData';
import type { AIExplanation } from '../types';

export default function CodeLab() {
  const { code, setCode } = useAppStore();
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [running, setRunning] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  async function run() {
    setRunning(true);
    setError('');
    setOutput('');
    try {
      const trace = await executeCode(code);
      setIsDemo(true);
      if (trace.error) {
        setError(trace.error);
        setOutput(trace.output);
      } else {
        setOutput(trace.output || '(no output)');
      }
    } catch (e: any) {
      setError(e.message || 'Execution failed');
    } finally {
      setRunning(false);
    }
  }

  async function explain() {
    setExplaining(true);
    try {
      const result = await explainCode(code);
      setExplanation(result);
    } catch (e: any) {
      setError(e.message || 'Explanation failed');
    } finally {
      setExplaining(false);
    }
  }

  function loadSample(id: string) {
    const project = SAMPLE_PROJECTS.find((p) => p.id === id);
    if (project) {
      setCode(project.code);
      setOutput('');
      setError('');
      setExplanation(null);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <PageHeader
        icon={<Code size={18} />}
        title="Code Lab"
        subtitle="Write or paste Python code, run it, and get AI-powered explanations"
      />

      {isDemo && <DemoBanner />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: editor + controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="text-xs px-3 py-1.5 rounded border"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              onChange={(e) => loadSample(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Load sample project…</option>
              {SAMPLE_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex-1" />
            <button onClick={explain} disabled={explaining || running} className="btn-ghost flex items-center gap-1.5 text-xs">
              {explaining ? <RefreshCw size={12} className="animate-spin" /> : <Lightbulb size={12} />}
              Explain
            </button>
            <button onClick={run} disabled={running} className="btn-primary flex items-center gap-2 text-xs">
              {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              Run
            </button>
          </div>

          {/* Editor */}
          <div className="panel overflow-hidden">
            <div className="px-3 py-2 flex items-center gap-2"
                 style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
              <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>script.py</span>
            </div>
            <CodeEditor value={code} onChange={setCode} height="380px" />
          </div>

          {/* Output */}
          <div className="panel">
            <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>OUTPUT</span>
            </div>
            <div className="p-4 min-h-16">
              {running && <LoadingSpinner label="Running…" size="sm" />}
              {!running && error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
              {!running && !error && output && (
                <pre className="text-xs m-0 whitespace-pre-wrap code-font"
                     style={{ color: 'var(--accent-green)' }}>{output}</pre>
              )}
              {!running && !error && !output && (
                <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>Click Run to execute your code.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: explanation panel */}
        <div className="space-y-4">
          <div className="panel h-full">
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <Lightbulb size={14} style={{ color: 'var(--accent-violet)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>AI EXPLANATION</span>
            </div>

            <div className="p-4">
              {explaining && <LoadingSpinner label="Generating explanation…" size="sm" />}

              {!explaining && !explanation && (
                <div className="text-center py-8">
                  <Lightbulb size={24} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Click <strong style={{ color: 'var(--text-secondary)' }}>Explain</strong> to get an AI-powered walkthrough of your code.
                  </p>
                </div>
              )}

              {!explaining && explanation && (
                <div className="space-y-4 fade-in">
                  {explanation.isDemo && (
                    <div className="text-xs px-3 py-2 rounded"
                         style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                      ⚡ Pattern-based (demo)
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>SUMMARY</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{explanation.summary}</p>
                  </div>

                  {explanation.concepts.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>CONCEPTS</p>
                      <div className="flex flex-wrap gap-1">
                        {explanation.concepts.map((c) => (
                          <span key={c} className="text-xs px-2 py-0.5 rounded"
                                style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: 'var(--accent-violet)', border: '1px solid rgba(139,92,246,0.2)' }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {explanation.complexity && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>COMPLEXITY</p>
                      <span className="text-xs code-font" style={{ color: 'var(--accent-cyan)' }}>{explanation.complexity}</span>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>LINE BY LINE</p>
                    <div className="space-y-2">
                      {explanation.lineByLine.map((item) => (
                        <div key={item.lineNumber} className="text-xs">
                          <div className="flex items-start gap-2">
                            <span className="code-font shrink-0 w-6 text-right" style={{ color: 'var(--text-muted)' }}>
                              {item.lineNumber}
                            </span>
                            <div>
                              <code className="text-xs block mb-0.5" style={{ color: 'var(--accent-cyan)' }}>{item.code}</code>
                              <span style={{ color: 'var(--text-secondary)' }}>{item.explanation}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
