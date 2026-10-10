import { useState } from 'react';
import { GitCompare, Play, RotateCcw, RefreshCw, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { CodeEditor } from '../components/CodeEditor';
import { LoadingSpinner, ErrorBanner, DemoBanner, PageHeader } from '../components/ui';
import { compareCode } from '../lib/api';
import { DEMO_CODE_BUGGY, DEMO_CODE_FIXED } from '../lib/demoData';
import type { ComparisonResult } from '../types';

export default function WhatIf() {
  const [originalCode, setOriginalCode] = useState(DEMO_CODE_BUGGY);
  const [modifiedCode, setModifiedCode] = useState(DEMO_CODE_FIXED);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  async function runComparison() {
    setLoading(true);
    setError('');
    try {
      const res = await compareCode(originalCode, modifiedCode);
      setResult(res);
      setIsDemo(true);
    } catch (e: any) {
      setError(e.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  }

  function loadDemo() {
    setOriginalCode(DEMO_CODE_BUGGY);
    setModifiedCode(DEMO_CODE_FIXED);
    setResult(null);
  }

  const diffTypeColors: Record<string, string> = {
    output: '#06b6d4',
    variable: '#8b5cf6',
    error: '#ef4444',
    behavior: '#f59e0b',
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <PageHeader
        icon={<GitCompare size={18} />}
        title="What-If Simulator"
        subtitle="Compare original and modified code — run both, inspect differences, test boundaries"
        accent="#10b981"
      />

      {isDemo && <DemoBanner message="Showing pre-recorded comparison results. Connect backend for live side-by-side execution." />}

      {/* Side-by-side editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Original */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>ORIGINAL CODE</span>
          </div>
          <div className="panel overflow-hidden">
            <CodeEditor value={originalCode} onChange={setOriginalCode} height="280px" />
          </div>
        </div>

        {/* Modified */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>MODIFIED CODE</span>
          </div>
          <div className="panel overflow-hidden">
            <CodeEditor value={modifiedCode} onChange={setModifiedCode} height="280px" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button onClick={loadDemo} className="btn-ghost flex items-center gap-1.5 text-xs">
          <RotateCcw size={12} /> Load Demo Pair
        </button>
        <div className="flex-1" />
        <button onClick={runComparison} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
          Compare Both Versions
        </button>
      </div>

      {loading && <LoadingSpinner label="Running both versions…" />}
      {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

      {/* Results */}
      {result && (
        <div className="space-y-4 fade-in">
          {/* Output comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={14} style={{ color: '#ef4444' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>ORIGINAL OUTPUT</span>
              </div>
              {result.originalError ? (
                <pre className="text-xs code-font whitespace-pre-wrap m-0 p-3 rounded"
                     style={{ backgroundColor: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {result.originalOutput || result.originalError}
                </pre>
              ) : (
                <pre className="text-xs code-font whitespace-pre-wrap m-0 p-3 rounded"
                     style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-green)' }}>
                  {result.originalOutput}
                </pre>
              )}
            </div>

            <div className="panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} style={{ color: '#10b981' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>MODIFIED OUTPUT</span>
              </div>
              {result.modifiedError ? (
                <pre className="text-xs code-font whitespace-pre-wrap m-0 p-3 rounded"
                     style={{ backgroundColor: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {result.modifiedOutput || result.modifiedError}
                </pre>
              ) : (
                <pre className="text-xs code-font whitespace-pre-wrap m-0 p-3 rounded"
                     style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-green)' }}>
                  {result.modifiedOutput}
                </pre>
              )}
            </div>
          </div>

          {/* Behavioral summary */}
          {result.behavioralSummary && (
            <div className="panel p-4">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>BEHAVIORAL ANALYSIS</p>
              <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text-primary)' }}>{result.behavioralSummary}</p>
            </div>
          )}

          {/* Differences */}
          {result.differences.length > 0 && (
            <div className="panel p-4">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>DIFFERENCES DETECTED</p>
              <div className="space-y-3">
                {result.differences.map((diff, i) => (
                  <div key={i} className="rounded p-3"
                       style={{ backgroundColor: 'var(--bg-elevated)', border: `1px solid ${diffTypeColors[diff.type] ?? 'var(--border)'}30` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ color: diffTypeColors[diff.type], backgroundColor: diffTypeColors[diff.type] + '15' }}>
                        {diff.type.toUpperCase()}
                      </span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{diff.description}</span>
                      {diff.isImprovement === true && (
                        <span className="ml-auto text-xs" style={{ color: '#10b981' }}>↑ improvement</span>
                      )}
                      {diff.isImprovement === false && (
                        <span className="ml-auto text-xs" style={{ color: '#ef4444' }}>↓ regression</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-xs mb-1 block" style={{ color: '#ef4444' }}>Original</span>
                        <span className="code-font" style={{ color: 'var(--text-secondary)' }}>{diff.original}</span>
                      </div>
                      <div>
                        <span className="text-xs mb-1 block" style={{ color: '#10b981' }}>Modified</span>
                        <span className="code-font" style={{ color: 'var(--text-secondary)' }}>{diff.modified}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boundary tests */}
          {result.boundaryTests.length > 0 && (
            <div className="panel p-4">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>BOUNDARY CASE TESTS</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Test', 'Input', 'Original', 'Modified', 'Status'].map((h) => (
                        <th key={h} className="text-left pb-2 pr-4 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.boundaryTests.map((test, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2 pr-4 font-medium" style={{ color: 'var(--text-primary)' }}>{test.name}</td>
                        <td className="py-2 pr-4 code-font" style={{ color: 'var(--accent-cyan)' }}>{test.input}</td>
                        <td className="py-2 pr-4" style={{ color: '#ef4444' }}>{test.originalResult}</td>
                        <td className="py-2 pr-4" style={{ color: '#10b981' }}>{test.modifiedResult}</td>
                        <td className="py-2">
                          {test.passed
                            ? <span className="tag-verified flex items-center gap-1 w-fit"><CheckCircle size={10} />Pass</span>
                            : <span className="tag-error flex items-center gap-1 w-fit"><XCircle size={10} />Fail</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="panel p-8 text-center">
          <GitCompare size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Edit both code panels and click <strong>Compare Both Versions</strong>
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            The demo loads a buggy vs fixed version of the off-by-one example
          </p>
          <button onClick={loadDemo} className="btn-ghost text-xs flex items-center gap-1.5 mx-auto">
            <RotateCcw size={12} /> Load Demo Pair <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
