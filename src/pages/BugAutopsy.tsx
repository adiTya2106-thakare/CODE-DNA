import { useState } from 'react';
import { Bug, Copy, RotateCcw, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { CodeEditor } from '../components/CodeEditor';
import { LoadingSpinner, ErrorBanner, DemoBanner, PageHeader, SectionHeader } from '../components/ui';
import { analyzeBug } from '../lib/api';
import { useAppStore } from '../lib/store';
import { DEMO_CODE_BUGGY } from '../lib/demoData';
import type { BugFinding } from '../types';

export default function BugAutopsy() {
  const { code, setCode } = useAppStore();
  const [finding, setFinding] = useState<BugFinding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [fixApplied, setFixApplied] = useState(false);
  const [fixedCodeValue, setFixedCodeValue] = useState('');
  const [showFixEditor, setShowFixEditor] = useState(false);
  const [copied, setCopied] = useState(false);

  async function analyze() {
    setLoading(true);
    setError('');
    setFixApplied(false);
    setShowFixEditor(false);
    try {
      const result = await analyzeBug(code);
      setFinding(result);
      setFixedCodeValue(result.fixedCode);
      setIsDemo(true);
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  function applyFix() {
    if (finding) {
      setFixedCodeValue(finding.fixedCode);
      setShowFixEditor(true);
      setFixApplied(true);
    }
  }

  function revertFix() {
    setShowFixEditor(false);
    setFixApplied(false);
    setFixedCodeValue('');
  }

  async function copyFix() {
    if (finding) {
      await navigator.clipboard.writeText(finding.fixedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const confidenceColor = (c: string) =>
    c === 'high' ? '#10b981' : c === 'medium' ? '#f59e0b' : '#ef4444';

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <PageHeader
        icon={<Bug size={18} />}
        title="Bug Autopsy"
        subtitle="Dissect any bug — root cause, event sequence, verified fix, and clear evidence"
        accent="#ef4444"
      />

      {isDemo && <DemoBanner message="Showing pre-computed analysis. Connect backend with LLM key for AI-powered bug analysis." />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code input */}
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="px-3 py-2 flex items-center justify-between"
                 style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {showFixEditor ? 'fixed_script.py' : 'script.py — suspicious code'}
              </span>
              {fixApplied && (
                <span className="text-xs px-2 py-0.5 rounded font-semibold"
                      style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                  ✓ Fix Applied
                </span>
              )}
            </div>
            <CodeEditor
              value={showFixEditor ? fixedCodeValue : code}
              onChange={showFixEditor ? setFixedCodeValue : setCode}
              height="360px"
              highlightLine={finding?.errorLine}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setCode(DEMO_CODE_BUGGY); setFinding(null); setShowFixEditor(false); setFixApplied(false); }}
              className="btn-ghost flex items-center gap-1.5 text-xs"
            >
              <RotateCcw size={12} /> Load Demo Bug
            </button>
            <div className="flex-1" />
            {fixApplied && (
              <button onClick={revertFix} className="btn-ghost flex items-center gap-1.5 text-xs">
                <RotateCcw size={12} /> Revert to Original
              </button>
            )}
            <button onClick={analyze} disabled={loading} className="btn-primary flex items-center gap-2 text-xs">
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Bug size={12} />}
              Run Autopsy
            </button>
          </div>

          {loading && <LoadingSpinner label="Analyzing bug…" />}
          {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        </div>

        {/* Findings panel */}
        <div className="space-y-4">
          {!finding && !loading && (
            <div className="panel p-8 text-center h-full flex flex-col items-center justify-center">
              <Bug size={32} className="mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Paste buggy code and click <strong>Run Autopsy</strong>
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                The pre-loaded demo has a classic off-by-one error
              </p>
            </div>
          )}

          {finding && (
            <div className="space-y-3 fade-in">
              {/* Error header */}
              <div className="panel p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tag-error">{finding.errorType}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>at line {finding.errorLine}</span>
                    </div>
                    <p className="text-sm font-semibold m-0" style={{ color: '#ef4444' }}>
                      {finding.errorMessage}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded"
                        style={{ color: confidenceColor(finding.confidence), backgroundColor: confidenceColor(finding.confidence) + '15' }}>
                    {finding.confidence} confidence
                  </span>
                </div>
              </div>

              {/* Root Cause */}
              <div className="panel p-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold m-0" style={{ color: 'var(--text-secondary)' }}>ROOT CAUSE</p>
                  <span className={finding.isVerified ? 'tag-verified' : 'tag-hypothesis'}>
                    {finding.isVerified ? '✓ VERIFIED FACT' : '~ HYPOTHESIS'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed m-0 mb-3" style={{ color: 'var(--text-primary)' }}>
                  {finding.rootCause}
                </p>
                <div className="rounded p-3 text-xs code-font"
                     style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-cyan)', borderLeft: '3px solid var(--accent-violet)' }}>
                  <p className="text-xs font-semibold mb-1 m-0" style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>EVIDENCE</p>
                  {finding.rootCauseEvidence}
                </div>
              </div>

              {/* Event Sequence */}
              <div className="panel p-4">
                <SectionHeader title="Event Sequence" subtitle="How the bug occurred, step by step" />
                <div className="space-y-2">
                  {finding.eventSequence.map((event, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                           style={{
                             backgroundColor: i === finding.eventSequence.length - 1 ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
                             color: i === finding.eventSequence.length - 1 ? '#ef4444' : 'var(--accent-violet)',
                           }}>
                        {i + 1}
                      </div>
                      <p className="m-0 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{event}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Fix */}
              <div className="panel p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold m-0" style={{ color: 'var(--text-secondary)' }}>SUGGESTED FIX</p>
                    {finding.verificationPassed && (
                      <span className="tag-verified flex items-center gap-1">
                        <CheckCircle size={10} /> VERIFIED
                      </span>
                    )}
                    {!finding.verificationPassed && (
                      <span className="tag-hypothesis flex items-center gap-1">
                        <AlertTriangle size={10} /> UNVERIFIED
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-primary)' }}>
                  {finding.suggestedFix}
                </p>
                {finding.verificationResult && (
                  <div className="text-xs p-3 rounded mb-3"
                       style={{
                         backgroundColor: finding.verificationPassed ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                         border: `1px solid ${finding.verificationPassed ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                         color: finding.verificationPassed ? '#10b981' : '#f59e0b',
                       }}>
                    {finding.verificationResult}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={applyFix} disabled={fixApplied} className="btn-primary flex items-center gap-1.5 text-xs">
                    {fixApplied ? '✓ Fix Applied' : 'Apply Fix to Editor'}
                  </button>
                  <button onClick={copyFix} className="btn-ghost flex items-center gap-1.5 text-xs">
                    <Copy size={11} /> {copied ? 'Copied!' : 'Copy Fix'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
