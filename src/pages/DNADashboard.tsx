import { Brain, TrendingUp, Target, BookOpen, MessageSquare, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui';
import { useAppStore } from '../lib/store';

export default function DNADashboard() {
  const { learningSession } = useAppStore();
  const totalAttempts = learningSession.teachBackAttempts.length;
  const avgScore = totalAttempts > 0
    ? Math.round(learningSession.teachBackAttempts.reduce((s, a) => s + a.score, 0) / totalAttempts)
    : 0;

  const accuracy = learningSession.questionsAnswered > 0
    ? Math.round((learningSession.correctAnswers / learningSession.questionsAnswered) * 100)
    : 0;

  const stats = [
    { icon: Target, label: 'Questions Answered', value: learningSession.questionsAnswered, color: '#8b5cf6' },
    { icon: TrendingUp, label: 'Accuracy', value: `${accuracy}%`, color: '#10b981' },
    { icon: BookOpen, label: 'Concepts Explored', value: learningSession.conceptsEncountered.length, color: '#06b6d4' },
    { icon: MessageSquare, label: 'Teach-Backs', value: totalAttempts, color: '#f59e0b' },
    { icon: Award, label: 'Avg Teach-Back Score', value: totalAttempts > 0 ? avgScore : '—', color: '#ef4444' },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <PageHeader
        icon={<Brain size={18} />}
        title="Personal Learning DNA"
        subtitle="Your adaptive learning profile — track progress, identify gaps, measure understanding"
        accent="#8b5cf6"
      />

      {learningSession.questionsAnswered === 0 ? (
        <div className="panel p-12 text-center">
          <Brain size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Your Learning DNA is waiting to be built
          </h3>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Answer prediction questions, attempt Teach-Back challenges, and explore concepts to build your personalized learning profile.
          </p>
          <Link to="/learning" className="no-underline">
            <button className="btn-primary">Start Learning Studio →</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="panel p-4 text-center">
                <Icon size={20} className="mx-auto mb-2" style={{ color }} />
                <p className="text-2xl font-bold m-0 mb-1" style={{ color }}>{value}</p>
                <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Concepts */}
          {learningSession.conceptsEncountered.length > 0 && (
            <div className="panel p-5">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>CONCEPTS ENCOUNTERED</p>
              <div className="flex flex-wrap gap-2">
                {learningSession.conceptsEncountered.map((c) => (
                  <span key={c} className="text-sm px-3 py-1 rounded-full font-medium"
                        style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: 'var(--accent-violet)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Teach-Back history */}
          {learningSession.teachBackAttempts.length > 0 && (
            <div className="panel p-5">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>TEACH-BACK HISTORY</p>
              <div className="space-y-4">
                {learningSession.teachBackAttempts.map((attempt, i) => {
                  const scoreColor = attempt.score >= 70 ? '#10b981' : attempt.score >= 40 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={i} className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-medium m-0" style={{ color: 'var(--text-primary)' }}>
                          Attempt #{i + 1}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold" style={{ color: scoreColor }}>{attempt.score}</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full mb-3" style={{ backgroundColor: 'var(--bg-panel)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${attempt.score}%`, backgroundColor: scoreColor }} />
                      </div>
                      <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {attempt.feedback}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
