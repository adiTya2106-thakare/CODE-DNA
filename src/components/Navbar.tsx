import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Dna, Code, Clock, Bug, GitCompare, Network, BookOpen, Brain, Menu, X, Zap
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Dna },
  { path: '/lab', label: 'Code Lab', icon: Code },
  { path: '/time-machine', label: 'Time Machine', icon: Clock },
  { path: '/bug-autopsy', label: 'Bug Autopsy', icon: Bug },
  { path: '/what-if', label: 'What-If', icon: GitCompare },
  { path: '/impact-graph', label: 'Impact Graph', icon: Network },
  { path: '/learning', label: 'Learning', icon: BookOpen },
  { path: '/dna-dashboard', label: 'My DNA', icon: Brain },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}
         className="sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="flex items-center justify-center w-8 h-8 rounded-md"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}>
            <Dna size={16} color="white" />
          </div>
          <span className="font-bold text-base tracking-tight"
                style={{ color: 'var(--text-primary)' }}>
            CODE<span style={{ color: 'var(--accent-violet)' }}>DNA</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.slice(1).map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all no-underline"
                style={{
                  color: active ? 'var(--accent-violet)' : 'var(--text-secondary)',
                  backgroundColor: active ? 'rgba(139,92,246,0.1)' : 'transparent',
                }}
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Demo badge */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Zap size={10} />
            DEMO MODE
          </span>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 rounded"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden px-4 pb-4 grid grid-cols-2 gap-1"
             style={{ borderTop: '1px solid var(--border)' }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium no-underline"
                style={{
                  color: active ? 'var(--accent-violet)' : 'var(--text-secondary)',
                  backgroundColor: active ? 'rgba(139,92,246,0.1)' : 'transparent',
                }}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
