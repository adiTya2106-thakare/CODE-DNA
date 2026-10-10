import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ label = 'Processing...', size = 'md' }: LoadingSpinnerProps) {
  const sz = size === 'sm' ? 16 : size === 'lg' ? 32 : 20;
  return (
    <div className="flex items-center gap-3 py-8 justify-center">
      <Loader2 size={sz} className="animate-spin" style={{ color: 'var(--accent-violet)' }} />
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg text-sm"
         style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
      <span className="font-mono flex-1 whitespace-pre-wrap">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
      )}
    </div>
  );
}

interface DemoBannerProps {
  message?: string;
}

export function DemoBanner({ message }: DemoBannerProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs mb-4"
         style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
      <span className="font-semibold">⚡ DEMO MODE</span>
      <span style={{ color: 'var(--text-secondary)' }}>
        {message ?? 'Backend not connected — showing pre-recorded demo data. Start the FastAPI server for live execution.'}
      </span>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, badge, badgeColor = 'var(--accent-violet)', action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-semibold m-0" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ color: badgeColor, backgroundColor: `${badgeColor}18`, border: `1px solid ${badgeColor}40` }}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent?: string;
}

export function PageHeader({ icon, title, subtitle, accent = 'var(--accent-violet)' }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
             style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        <div>
          <h1 className="text-xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
