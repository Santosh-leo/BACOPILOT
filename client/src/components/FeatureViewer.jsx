import { Zap } from 'lucide-react';

/**
 * Feature Viewer - Displays extracted interactive elements per page.
 */
export default function FeatureViewer({ features }) {
  if (!features) {
    return (
      <div className="detail-card">
        <div className="detail-card-header">
          <Zap size={16} className="icon" />
          <h3>Extracted Features</h3>
        </div>
        <div className="detail-card-body">
          <div className="empty-state">
            <p>Select a page to view extracted features</p>
          </div>
        </div>
      </div>
    );
  }

  const elements = features.interactive_elements || [];
  const sections = features.sections || [];

  return (
    <div className="detail-card">
      <div className="detail-card-header">
        <Zap size={16} className="icon" />
        <h3>Extracted Features ({elements.length + sections.length})</h3>
      </div>
      <div className="detail-card-body">
        {elements.length === 0 && sections.length === 0 ? (
          <p style={{ color: 'var(--gray-500)' }}>No interactive elements found on this page.</p>
        ) : (
          <div className="feature-grid">
            {elements.map((el, i) => (
              <div key={`el-${i}`} className="feature-chip">
                <div className="feature-chip-type">{el.type}</div>
                <div className="feature-chip-text">{el.text || el.placeholder || el.label || 'unnamed'}</div>
                {el.actionHint && <div className="feature-chip-hint">→ {el.actionHint}</div>}
              </div>
            ))}
            {sections.map((s, i) => (
              <div key={`sec-${i}`} className="feature-chip">
                <div className="feature-chip-type">{s.level}</div>
                <div className="feature-chip-text">{s.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
