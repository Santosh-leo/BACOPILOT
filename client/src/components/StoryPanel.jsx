import { BookOpen, ChevronDown, ChevronRight, Target, AlertTriangle, CheckCircle, Link2, ListChecks } from 'lucide-react';
import { useState } from 'react';

/**
 * Story Panel - Displays Jira-format Epics with nested User Stories.
 */
export default function StoryPanel({ stories }) {
  const [expandedEpics, setExpandedEpics] = useState({});
  const [expandedStories, setExpandedStories] = useState({});

  if (!stories) {
    return (
      <div className="detail-card">
        <div className="detail-card-header">
          <BookOpen size={16} className="icon" />
          <h3>Epics & User Stories</h3>
        </div>
        <div className="detail-card-body">
          <div className="empty-state">
            <p>Epics and user stories will appear after LLM analysis</p>
          </div>
        </div>
      </div>
    );
  }

  if (stories.error) {
    return (
      <div className="detail-card">
        <div className="detail-card-header">
          <BookOpen size={16} className="icon" />
          <h3>Epics & User Stories</h3>
        </div>
        <div className="detail-card-body">
          <div className="story-error">⚠️ LLM Error: {stories.error}</div>
        </div>
      </div>
    );
  }

  const epics = stories.epics || [];

  const toggleEpic = (i) => setExpandedEpics(prev => ({ ...prev, [i]: !prev[i] }));
  const toggleStory = (key) => setExpandedStories(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="detail-card">
      <div className="detail-card-header">
        <BookOpen size={16} className="icon" />
        <h3>Epics & User Stories ({epics.length} epics)</h3>
      </div>
      <div className="detail-card-body">
        {epics.length === 0 ? (
          <p style={{ color: 'var(--gray-500)' }}>No epics generated for this page.</p>
        ) : (
          epics.map((epic, i) => (
            <div key={i} className="epic-card">
              {/* Epic Header */}
              <div className="epic-header" onClick={() => toggleEpic(i)}>
                <div className="epic-toggle">
                  {expandedEpics[i] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                <div className="epic-badge">EPIC</div>
                <div className="epic-summary">{epic.summary}</div>
                <div className="epic-story-count">
                  {(epic.user_stories || []).length} stories
                </div>
              </div>

              {/* Epic Details (expanded) */}
              {expandedEpics[i] && (
                <div className="epic-body">
                  {/* Description */}
                  {epic.description && (
                    <div className="epic-section">
                      <div className="epic-section-label">Description</div>
                      <div className="epic-section-text">{epic.description}</div>
                    </div>
                  )}

                  {/* Requirements */}
                  {epic.requirements?.length > 0 && (
                    <div className="epic-section">
                      <div className="epic-section-label"><ListChecks size={12} /> Requirements</div>
                      <ul className="epic-list">
                        {epic.requirements.map((r, j) => <li key={j}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Scope */}
                  {epic.scope && (
                    <div className="epic-section">
                      <div className="epic-section-label"><Target size={12} /> Scope</div>
                      <div className="epic-section-text">{epic.scope}</div>
                    </div>
                  )}

                  {/* Dependencies */}
                  {epic.dependencies?.length > 0 && (
                    <div className="epic-section">
                      <div className="epic-section-label"><Link2 size={12} /> Dependencies</div>
                      <ul className="epic-list">
                        {epic.dependencies.map((d, j) => <li key={j}>{d}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Risks */}
                  {epic.risks?.length > 0 && (
                    <div className="epic-section">
                      <div className="epic-section-label"><AlertTriangle size={12} /> Risks</div>
                      <ul className="epic-list risk">
                        {epic.risks.map((r, j) => <li key={j}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Acceptance Criteria */}
                  {epic.acceptance_criteria?.length > 0 && (
                    <div className="epic-section">
                      <div className="epic-section-label"><CheckCircle size={12} /> Acceptance Criteria</div>
                      <ul className="epic-list ac">
                        {epic.acceptance_criteria.map((ac, j) => <li key={j}>{ac}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* User Stories */}
                  <div className="epic-stories-header">User Stories</div>
                  {(epic.user_stories || []).map((story, j) => {
                    const key = `${i}-${j}`;
                    return (
                      <div key={j} className="story-card">
                        <div className="story-card-header" onClick={() => toggleStory(key)}>
                          <div className="story-toggle">
                            {expandedStories[key] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                          <div className="story-badge">STORY</div>
                          <div className="story-title">{story.title || 'User Story'}</div>
                        </div>

                        {expandedStories[key] && (
                          <div className="story-card-body">
                            <div className="story-as-a">{story.story}</div>

                            {story.description && (
                              <div className="story-section">
                                <div className="story-section-label">Description</div>
                                <div className="story-section-text">{story.description}</div>
                              </div>
                            )}

                            {story.acceptance_criteria?.length > 0 && (
                              <div className="story-section">
                                <div className="story-section-label">Acceptance Criteria</div>
                                <ul className="story-ac-list">
                                  {story.acceptance_criteria.map((ac, k) => (
                                    <li key={k}>{ac}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
