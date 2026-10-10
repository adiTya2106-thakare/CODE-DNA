import { useState } from 'react';
import { BookOpen, ChevronRight, Lightbulb, CheckCircle, MessageSquare, RefreshCw } from 'lucide-react';
import { CodeEditor } from '../components/CodeEditor';
import { LoadingSpinner, DemoBanner, PageHeader } from '../components/ui';
import { evaluateTeachBack } from '../lib/api';
import { useAppStore } from '../lib/store';
import { DEMO_LEARNING_QUESTION } from '../lib/demoData';
import type { LearningQuestion } from '../types';

type Phase = 'predict' | 'hint' | 'reveal' | 'teach-back' | 'result';

export default function Learning() {
  const { learningSession, updateLearningSession } = useAppStore();
  const [question] = useState<LearningQuestion>(DEMO_LEARNING_QUESTION);
  const [phase, setPhase] = useState<Phase>('predict');
  const [userPrediction, setUserPrediction] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [shownHints, setShownHints] = useState<number[]>([]);
  const [teachBackText, setTeachBackText] = useState('');
  const [teachBackResult, setTeachBackResult] = useState<{ score: number; feedback: string } | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [isDemo] = useState(true);

  function revealAnswer() {
    setPhase('reveal');
    updateLearningSession({
      questionsAnswered: learningSession.questionsAnswered + 1,
    });
  }

  function showHint() {
    if (hintIndex < question.hints.length) {
      setShownHints((prev) => [...prev, hintIndex]);
      setHintIndex(hintIndex + 1);
      setPhase('hint');
    }
  }

  function goToTeachBack() {
    setPhase('teach-back');
  }

  async function submitTeachBack() {
    if (!teachBackText.trim()) return;
    setEvaluating(true);
    try {
      const result = await evaluateTeachBack(question.code, teachBackText);
      setTeachBackResult(result);
      setPhase('result');
      updateLearningSession({
        teachBackAttempts: [
          ...learningSession.teachBackAttempts,
          { question: question.question, userExplanation: teachBackText, feedback: result.feedback, score: result.score, timestamp: new Date() },
        ],
        correctAnswers: result.score >= 70 ? learningSession.correctAnswers + 1 : learningSession.correctAnswers,
        conceptsEncountered: [...new Set([...learningSession.conceptsEncountered, question.concept])],
      });
    } finally {
      setEvaluating(false);
    }
  }

  function reset() {
    setPhase('predict');
    setUserPrediction('');
    setShownHints([]);
    setHintIndex(0);
    setTeachBackText('');
    setTeachBackResult(null);
  }

  // Check for misconceptions
  const triggeredMisconceptions = question.misconceptions.filter(m =>
    userPrediction.toLowerCase().includes(m.trigger.toLowerCase())
  );

  const scoreColor = teachBackResult
    ? teachBackResult.score >= 70 ? '#10b981' : teachBackResult.score >= 40 ? '#f59e0b' : '#ef4444'
    : '#8b91a6';

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <PageHeader
        icon={<BookOpen size={18} />}
        title="Learning Studio"
        subtitle="Predict program behavior, explore misconceptions, prove understanding with Teach-Back"
        accent="#f59e0b"
      />

      {isDemo && <DemoBanner message="Demo question loaded. Connect backend for adaptive AI-generated follow-ups." />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Code + question */}
        <div className="lg:col-span-2 space-y-4">
          {/* Question */}
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded font-semibold capitalize"
                    style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                {question.difficulty}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{question.concept}</span>
            </div>
            <h3 className="text-base font-semibold mb-4 m-0" style={{ color: 'var(--text-primary)' }}>
              {question.question}
            </h3>

            <div className="panel-elevated overflow-hidden rounded-lg">
              <CodeEditor value={question.code} readOnly height="140px" />
            </div>
          </div>

          {/* Phase: Predict */}
          {(phase === 'predict' || phase === 'hint') && (
            <div className="panel p-5 fade-in">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                YOUR PREDICTION
              </p>
              <textarea
                className="w-full rounded-lg p-3 text-sm resize-none"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                  minHeight: '80px',
                }}
                placeholder="What will this code output? Will it raise an error? Explain your reasoning…"
                value={userPrediction}
                onChange={(e) => setUserPrediction(e.target.value)}
              />

              {/* Misconception warnings */}
              {userPrediction.length > 20 && triggeredMisconceptions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {triggeredMisconceptions.map((m, i) => (
                    <div key={i} className="flex gap-2 text-xs p-3 rounded"
                         style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                      <Lightbulb size={12} className="shrink-0 mt-0.5" />
                      <span><strong>Possible misconception:</strong> {m.explanation}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Shown hints */}
              {shownHints.length > 0 && (
                <div className="mt-3 space-y-2">
                  {shownHints.map((hi) => (
                    <div key={hi} className="flex gap-2 text-xs p-3 rounded"
                         style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--accent-violet)' }}>
                      <span className="font-semibold shrink-0">Hint {hi + 1}:</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{question.hints[hi]}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-4 flex-wrap">
                {hintIndex < question.hints.length && (
                  <button onClick={showHint} className="btn-ghost flex items-center gap-1.5 text-xs">
                    <Lightbulb size={12} /> Hint {hintIndex + 1}/{question.hints.length}
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={revealAnswer}
                  disabled={!userPrediction.trim()}
                  className="btn-primary flex items-center gap-2 text-xs"
                >
                  Reveal Answer <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Phase: Reveal */}
          {phase === 'reveal' && (
            <div className="panel p-5 fade-in">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <p className="text-sm font-semibold m-0" style={{ color: '#10b981' }}>CORRECT ANSWER</p>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
                {question.correctAnswer}
              </p>

              {userPrediction && (
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>YOUR PREDICTION</p>
                  <div className="text-xs p-3 rounded" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {userPrediction}
                  </div>
                </div>
              )}

              <div className="p-3 rounded text-sm mb-4"
                   style={{ backgroundColor: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', color: 'var(--accent-cyan)' }}>
                <strong>Follow-up challenge: </strong>{question.followUp}
              </div>

              <button onClick={goToTeachBack} className="btn-primary flex items-center gap-2 text-xs">
                <MessageSquare size={12} /> Take the Teach-Back Challenge
              </button>
            </div>
          )}

          {/* Phase: Teach-Back */}
          {phase === 'teach-back' && (
            <div className="panel p-5 fade-in">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={16} style={{ color: 'var(--accent-violet)' }} />
                <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-primary)' }}>TEACH-BACK CHALLENGE</p>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                Explain the bug in your own words. Pretend you're teaching this to a fellow beginner.
                The more specific and accurate your explanation, the higher your score.
              </p>
              <textarea
                className="w-full rounded-lg p-3 text-sm resize-none"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                  minHeight: '120px',
                }}
                placeholder="Explain what the bug is, why it happens, and how to fix it. Use specific line numbers and variable names from the code…"
                value={teachBackText}
                onChange={(e) => setTeachBackText(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <div className="flex-1" />
                {evaluating && <LoadingSpinner label="Evaluating…" size="sm" />}
                {!evaluating && (
                  <button
                    onClick={submitTeachBack}
                    disabled={teachBackText.trim().length < 20}
                    className="btn-primary flex items-center gap-2 text-xs"
                  >
                    Submit Explanation <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phase: Result */}
          {phase === 'result' && teachBackResult && (
            <div className="panel p-5 fade-in">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-primary)' }}>TEACH-BACK RESULT</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                    {teachBackResult.score}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>

              {/* Score bar */}
              <div className="w-full h-2 rounded-full mb-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${teachBackResult.score}%`, backgroundColor: scoreColor }}
                />
              </div>

              <div className="text-sm leading-relaxed p-4 rounded mb-4"
                   style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                {teachBackResult.feedback}
              </div>

              <div className="flex gap-2">
                <button onClick={reset} className="btn-ghost flex items-center gap-1.5 text-xs">
                  <RefreshCw size={12} /> Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: session stats + progress */}
        <div className="space-y-4">
          {/* Session stats */}
          <div className="panel p-4">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>SESSION STATS</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Questions', value: learningSession.questionsAnswered },
                { label: 'Correct', value: learningSession.correctAnswers },
                { label: 'Concepts', value: learningSession.conceptsEncountered.length },
                { label: 'Teach-Backs', value: learningSession.teachBackAttempts.length },
              ].map(({ label, value }) => (
                <div key={label} className="rounded p-3 text-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <p className="text-xl font-bold m-0" style={{ color: 'var(--accent-violet)' }}>{value}</p>
                  <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress steps */}
          <div className="panel p-4">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>LEARNING FLOW</p>
            <div className="space-y-2">
              {[
                { key: 'predict', label: 'Predict behavior', desc: 'Before seeing the answer' },
                { key: 'hint', label: 'Request hints', desc: 'If you need a nudge' },
                { key: 'reveal', label: 'Reveal answer', desc: 'See the correct explanation' },
                { key: 'teach-back', label: 'Teach-Back', desc: 'Explain it yourself' },
                { key: 'result', label: 'Get feedback', desc: 'Grounded in the code' },
              ].map(({ key, label, desc }) => {
                const phases: Phase[] = ['predict', 'hint', 'reveal', 'teach-back', 'result'];
                const currentIndex = phases.indexOf(phase);
                const thisIndex = phases.indexOf(key as Phase);
                const done = thisIndex < currentIndex;
                const active = key === phase || (key === 'hint' && phase === 'hint');
                return (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center`}
                         style={{
                           backgroundColor: done ? 'rgba(16,185,129,0.2)' : active ? 'rgba(139,92,246,0.2)' : 'var(--bg-elevated)',
                           border: `1px solid ${done ? '#10b981' : active ? 'var(--accent-violet)' : 'var(--border)'}`,
                         }}>
                      {done ? <CheckCircle size={10} style={{ color: '#10b981' }} /> :
                       active ? <span style={{ color: 'var(--accent-violet)', fontSize: '8px' }}>●</span> :
                       <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>○</span>}
                    </div>
                    <div>
                      <p className="m-0 font-medium" style={{ color: active ? 'var(--text-primary)' : done ? '#10b981' : 'var(--text-muted)' }}>{label}</p>
                      <p className="m-0" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Concepts encountered */}
          {learningSession.conceptsEncountered.length > 0 && (
            <div className="panel p-4">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>CONCEPTS ENCOUNTERED</p>
              <div className="flex flex-wrap gap-1">
                {learningSession.conceptsEncountered.map((c) => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: 'var(--accent-violet)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
