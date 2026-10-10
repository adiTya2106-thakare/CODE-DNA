import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Dna, Clock, Bug, GitCompare, Network, Brain, ArrowRight, Play, ChevronRight, Zap, Shield, Eye
} from 'lucide-react';
import { CodeEditor } from '../components/CodeEditor';
import { DEMO_CODE_BUGGY } from '../lib/demoData';

const features = [
  {
    icon: Clock,
    title: 'Code Time Machine',
    description: 'Step through execution line by line. Watch variables change, trace function calls, and move backward and forward through recorded program states.',
    accent: '#8b5cf6',
    path: '/time-machine',
  },
  {
    icon: Bug,
    title: 'Bug Autopsy',
    description: "Dissect any bug. See the error, root cause with evidence, event sequence, and a verified fix — clearly distinguishing facts from AI hypotheses.",
    accent: '#ef4444',
    path: '/bug-autopsy',
  },
  {
    icon: GitCompare,
    title: 'What-If Simulator',
    description: 'Compare original and modified code side by side. Run both, compare outputs, generate boundary tests, and see exactly what changed and why.',
    accent: '#10b981',
    path: '/what-if',
  },
  {
    icon: Network,
    title: 'Code Impact Graph',
    description: 'Visualize functions, variables, and dependencies as an interactive graph. Select any node to see what it affects and what affects it.',
    accent: '#06b6d4',
    path: '/impact-graph',
  },
  {
    icon: Brain,
    title: 'Personal Learning DNA',
    description: "Predict program behavior before seeing the answer. Receive adaptive hints, expose misconceptions, and prove understanding with Teach-Back challenges.",
    accent: '#f59e0b',
    path: '/learning',
  },
];

const trusts = [
  { icon: Eye, text: 'Every explanation is grounded in observable code evidence' },
  { icon: Shield, text: 'Verified facts are clearly separated from AI hypotheses' },
  { icon: Zap, text: 'Execution results come from a controlled Python sandbox' },
];

export default function Landing() {
  const [demoStep, setDemoStep] = useState(0);

  const demoSteps = [
    { label: 'Load buggy code', desc: 'A realistic off-by-one error is pre-loaded for you.' },
    { label: 'Run Time Machine', desc: 'Step through execution and watch the IndexError form.' },
    { label: 'Run Bug Autopsy', desc: 'Get root cause, event sequence, and verified fix.' },
    { label: 'Compare with What-If', desc: 'Run original vs fixed side-by-side.' },
    { label: 'Challenge yourself', desc: 'Predict, explain, and get personalized follow-ups.' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-deep)' }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        <div className="relative max-w-screen-xl mx-auto px-6 pt-16 pb-12">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                 style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--accent-violet)' }}>
              <Dna size={12} />
              Interactive Code Intelligence Lab
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Don't trust the explanation.
              <br />
              <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Investigate the evidence.
              </span>
            </h1>

            <p className="text-lg mb-8 max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              CODE DNA connects every AI explanation to observable execution traces, variable states, and test results.
              Step through code, dissect bugs, compare alternatives, and learn by predicting — not by reading.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/lab" className="no-underline">
                <button className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
                  <Play size={14} />
                  Start Exploring
                </button>
              </Link>
              <Link to="/time-machine" className="no-underline">
                <button className="btn-ghost flex items-center gap-2 px-6 py-3 text-sm">
                  <Clock size={14} />
                  Try Time Machine
                </button>
              </Link>
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-4 mt-10">
            {trusts.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Icon size={12} style={{ color: 'var(--accent-violet)' }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive demo preview */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3"
               style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
              <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>demo_project.py — off-by-one bug</span>
            </div>
            <Link to="/time-machine" className="no-underline">
              <button className="flex items-center gap-1 text-xs px-3 py-1 rounded"
                      style={{ color: 'var(--accent-violet)', backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                Open in Time Machine <ArrowRight size={10} />
              </button>
            </Link>
          </div>
          <CodeEditor value={DEMO_CODE_BUGGY} readOnly height="240px" highlightLine={4} />
        </div>
      </div>

      {/* 2-minute demo walkthrough */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Full demo in 2 minutes
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No account required. Click any step to jump there.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {demoSteps.map((step, i) => (
            <button
              key={i}
              onClick={() => setDemoStep(i)}
              className="text-left p-4 rounded-lg transition-all"
              style={{
                backgroundColor: demoStep === i ? 'rgba(139,92,246,0.1)' : 'var(--bg-panel)',
                border: `1px solid ${demoStep === i ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: demoStep === i ? 'var(--accent-violet)' : 'var(--bg-elevated)', color: demoStep === i ? 'white' : 'var(--text-muted)' }}>
                  {i + 1}
                </span>
                <span className="text-xs font-semibold" style={{ color: demoStep === i ? 'var(--accent-violet)' : 'var(--text-primary)' }}>
                  {step.label}
                </span>
              </div>
              <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
            </button>
          ))}
        </div>

        {demoStep >= 0 && (
          <div className="mt-4 flex justify-center">
            <Link to={['/lab', '/time-machine', '/bug-autopsy', '/what-if', '/learning'][demoStep]} className="no-underline">
              <button className="btn-primary flex items-center gap-2">
                Start Step {demoStep + 1}: {demoSteps[demoStep].label} <ChevronRight size={14} />
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Features grid */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Five features. One mission.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description, accent, path }) => (
            <Link key={path} to={path} className="no-underline group">
              <div className="panel p-5 h-full transition-all group-hover:border-opacity-60"
                   style={{ borderColor: 'var(--border)' }}
                   onMouseEnter={e => (e.currentTarget.style.borderColor = accent + '60')}
                   onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                     style={{ backgroundColor: accent + '15', border: `1px solid ${accent}30` }}>
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <h3 className="text-sm font-semibold mb-2 m-0" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-screen-xl mx-auto px-6 py-12 text-center">
        <div className="panel-elevated p-10 rounded-xl max-w-2xl mx-auto"
             style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(6,182,212,0.05) 100%)' }}>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            CODE DNA doesn't ask you to trust an explanation.
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            It lets you investigate the evidence, test the solution, and learn to reason about code yourself.
          </p>
          <Link to="/time-machine" className="no-underline">
            <button className="btn-primary px-8 py-3">
              Open Time Machine →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
