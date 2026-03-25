import { Search, Cpu, Brain, Check } from 'lucide-react';

const PHASES = [
  { key: 'crawling', label: 'Crawling', icon: Search },
  { key: 'extracting', label: 'Extracting', icon: Cpu },
  { key: 'analyzing', label: 'Analyzing', icon: Brain },
  { key: 'done', label: 'Done', icon: Check }
];

/**
 * Progress Tracker - Shows crawl/analysis phase with visual progress bar.
 */
export default function ProgressTracker({ status }) {
  if (!status) return null;

  const currentIdx = PHASES.findIndex(p => p.key === status.progress?.phase);
  const total = status.progress?.total || 1;
  const current = status.progress?.current || status.progress?.crawled || 0;
  const percentage = Math.min(Math.round((current / Math.max(total, 1)) * 100), 100);

  return (
    <div className="progress-tracker">
      <div className="progress-phases">
        {PHASES.map((phase, i) => {
          const Icon = phase.icon;
          const isDone = i < currentIdx || status.progress?.phase === 'done';
          const isActive = i === currentIdx && status.progress?.phase !== 'done';

          return (
            <div key={phase.key} className="phase-step">
              <div className={`phase-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                <Icon size={14} />
              </div>
              <span className={`phase-label ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>

      <div className="progress-info">
        <span>
          {status.progress?.phase === 'crawling'
            ? `Crawled ${current} pages`
            : status.progress?.phase === 'done'
            ? `Completed — ${status.pagesCount} pages processed`
            : `Processing ${current} of ${total}`
          }
        </span>
        <span>{percentage}%</span>
      </div>
    </div>
  );
}
