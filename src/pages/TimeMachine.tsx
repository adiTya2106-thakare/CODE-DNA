import { useState } from 'react';
import { Clock, Play, ChevronLeft, ChevronRight, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { CodeEditor } from '../components/CodeEditor';
import { LoadingSpinner, ErrorBanner, DemoBanner, PageHeader } from '../components/ui';
import { executeCode } from '../lib/api';
import { useAppStore } from '../lib/store';
import { SAMPLE_PROJECTS } from '../lib/demoData';
import type { ExecutionStep } from '../types';

export default function TimeMachine() {
  const { code, setCode, trace, setTrace, currentStep, setCurrentStep } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  async function runTrace() {
    setLoading(true);
    setError('');
    try {
      const result = await executeCode(code);
      setTrace(result);
      setCurrentStep(0);
      setIsDemo(true);
    } catch (e: any) {
      setError(e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  }

  const step: ExecutionStep | null = trace ? trace.steps[currentStep] ?? null : null;
  const totalSteps = trace?.steps.length ?? 0;

  function prev() { setCurrentStep(Math.max(0, currentStep - 1)); }
  function next() { setCurrentStep(Math.min(totalSteps - 1, currentStep + 1)); }
  function first() { setCurrentStep(0); }
  function last() { setCurrentStep(totalSteps - 1); }

  const eventColors: Record<string, string> = {
    call: '#8b5cf6',
    line: '#06b6d4',
    return: '#10b981',
    exception: '#ef4444',
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <PageHeader
        icon={<Clock size={18} />}
        title="Code Time Machine"
        subtitle="Step through execution state by state — watch variables change in real time"
        accent="#8b5cf6"
      />

      {isDemo && <DemoBanner message="Showing pre-recorded execution trace. Connect backend for live execution of any code." />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor + controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="text-xs px-3 py-1.5 rounded border"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              onChange={(e) => {
                const p = SAMPLE_PROJECTS.find(s => s.id === e.target.value);
                if (p) { setCode(p.code); setTrace(null); setCurrentStep(0); setError(''); }
              }}
              defaultValue=""
            >
              <option value="" disabled>Load sample…</option>
              {SAMPLE_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex-1" />
            <button onClick={runTrace} disabled={loading} className="btn-primary flex items-center gap-2 text-xs">
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              Record Execution
            </button>
          </div>

          {/* Code editor with current line highlighted */}
          <div className="panel overflow-hidden">
            <div className="px-3 py-2 flex items-center justify-between"
                 style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>script.py</span>
              {step && (
                <span className="text-xs px-2 py-0.5 rounded font-semibold"
                      style={{ backgroundColor: (eventColors[step.event] ?? '#8b91a6') + '20', color: eventColors[step.event] ?? '#8b91a6' }}>
                  {step.event.toUpperCase()} — Line {step.line}
                </span>
              )}
            </div>
            <CodeEditor
              value={code}
              readOnly
              height="340px"
              highlightLine={step?.line}
            />
          </div>

          {/* Playback controls */}
          {trace && (
            <div className="panel p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Step {currentStep + 1} / {totalSteps}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={first} className="btn-ghost p-2" title="First step">
                    <SkipBack size={14} />
                  </button>
                  <button onClick={prev} disabled={currentStep === 0} className="btn-ghost p-2">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={next} disabled={currentStep >= totalSteps - 1} className="btn-ghost p-2">
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={last} className="btn-ghost p-2" title="Last step">
                    <SkipForward size={14} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full mb-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: totalSteps > 1 ? `${(currentStep / (totalSteps - 1)) * 100}%` : '0%',
                    background: 'linear-gradient(90deg, #7c3aed, #0891b2)',
                  }}
                />
              </div>

              {/* Timeline dots */}
              <div className="flex gap-1 overflow-x-auto py-1">
                {trace.steps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    title={`Step ${i + 1}: ${s.event} line ${s.line}`}
                    className="shrink-0 w-3 h-3 rounded-full transition-all"
                    style={{
                      backgroundColor: i === currentStep
                        ? (eventColors[s.event] ?? '#8b91a6')
                        : i < currentStep
                        ? (eventColors[s.event] ?? '#8b91a6') + '60'
                        : 'var(--border-bright)',
                      transform: i === currentStep ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {!trace && !loading && (
            <div className="panel p-8 text-center">
              <Clock size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Click <strong>Record Execution</strong> to generate a step-by-step trace
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                The demo project has a pre-recorded trace for instant playback
              </p>
            </div>
          )}

          {loading && <LoadingSpinner label="Recording execution trace…" />}
          {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

          {/* Error output */}
          {trace?.error && (
            <div className="panel p-4">
              <p className="text-xs font-semibold mb-2" style={{ color: '#ef4444' }}>EXECUTION ERROR</p>
              <pre className="text-xs code-font whitespace-pre-wrap m-0" style={{ color: '#ef4444' }}>
                {trace.error}
              </pre>
            </div>
          )}
        </div>

        {/* Right: variable inspector + call stack */}
        <div className="space-y-4">
          {/* Current step annotation */}
          {step?.note && (
            <div className="panel p-4 slide-up">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>STEP ANNOTATION</p>
              <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text-primary)' }}>{step.note}</p>
            </div>
          )}

          {/* Variable Inspector */}
          <div className="panel">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>VARIABLES</span>
            </div>
            <div className="p-3">
              {step && Object.keys(step.variables).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(step.variables).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2 text-xs p-2 rounded"
                         style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <span className="font-semibold shrink-0" style={{ color: 'var(--accent-violet)' }}>{k}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>=</span>
                      <span className="code-font break-all" style={{ color: 'var(--accent-cyan)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs py-4 text-center m-0" style={{ color: 'var(--text-muted)' }}>
                  {trace ? 'No variables in scope at this step' : 'Run code to inspect variables'}
                </p>
              )}
            </div>
          </div>

          {/* Call Stack */}
          <div className="panel">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>CALL STACK</span>
            </div>
            <div className="p-3 space-y-1">
              {step?.callStack && step.callStack.length > 0 ? (
                [...step.callStack].reverse().map((frame, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded"
                       style={{ backgroundColor: i === 0 ? 'rgba(139,92,246,0.1)' : 'var(--bg-elevated)', border: i === 0 ? '1px solid rgba(139,92,246,0.2)' : 'none' }}>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{step.callStack.length - 1 - i}</span>
                    <span className="code-font" style={{ color: i === 0 ? 'var(--accent-violet)' : 'var(--text-secondary)' }}>{frame}</span>
                    {i === 0 && <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>← active</span>}
                  </div>
                ))
              ) : (
                <p className="text-xs py-4 text-center m-0" style={{ color: 'var(--text-muted)' }}>No call stack</p>
              )}
            </div>
          </div>

          {/* stdout so far */}
          {step?.stdout !== undefined && (
            <div className="panel">
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>STDOUT SO FAR</span>
              </div>
              <div className="p-3">
                {step.stdout ? (
                  <pre className="text-xs code-font m-0 whitespace-pre-wrap" style={{ color: 'var(--accent-green)' }}>{step.stdout}</pre>
                ) : (
                  <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>(no output yet)</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
