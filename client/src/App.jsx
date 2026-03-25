import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot } from 'lucide-react';
import UrlInput from './components/UrlInput';
import ProgressTracker from './components/ProgressTracker';
import PageList from './components/PageList';
import FeatureViewer from './components/FeatureViewer';
import StoryPanel from './components/StoryPanel';
import ExportControls from './components/ExportControls';
import { startCrawl, stopCrawl, getStatus, getPages, getStories, getOllamaStatus } from './services/api';

/**
 * Main Application - Orchestrates crawling, extraction, LLM analysis, and display.
 */
export default function App() {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [pages, setPages] = useState([]);
  const [stories, setStories] = useState([]);
  const [selectedPage, setSelectedPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ollamaOnline, setOllamaOnline] = useState(null);
  const pollRef = useRef(null);

  /** Check Ollama status on mount */
  useEffect(() => {
    getOllamaStatus().then(s => setOllamaOnline(s.available));
  }, []);

  /** Start crawling a URL */
  const handleCrawl = useCallback(async (url, maxPages) => {
    setError(null);
    setIsLoading(true);
    setPages([]);
    setStories([]);
    setSelectedPage(0);
    setStatus(null);

    try {
      const { jobId: id } = await startCrawl(url, maxPages);
      setJobId(id);
      startPolling(id);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  /** Stop an active crawl */
  const handleStopCrawl = useCallback(async () => {
    if (!jobId) return;
    try {
      await stopCrawl(jobId);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setIsLoading(false);
      setStatus(prev => ({ ...prev, status: 'stopped', progress: { ...prev?.progress, phase: 'stopped' } }));
    } catch (err) {
      setError(`Failed to stop: ${err.message}`);
    }
  }, [jobId]);

  /** Poll job status until done */
  const startPolling = useCallback((id) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const s = await getStatus(id);
        setStatus(s);

        if (s.status === 'done' || s.status === 'error') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setIsLoading(false);

          if (s.status === 'done') {
            const [pagesRes, storiesRes] = await Promise.all([
              getPages(id),
              getStories(id)
            ]);
            setPages(pagesRes.pages || []);
            setStories(storiesRes.stories || []);
          }
          if (s.status === 'error') {
            setError(s.error || 'Job failed');
          }
        }
      } catch {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setIsLoading(false);
      }
    }, 2000);
  }, []);

  /** Cleanup polling on unmount */
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  /** Get selected page data */
  const currentPage = pages[selectedPage] || null;
  const currentStory = stories[selectedPage] || null;

  return (
    <div className="app">
      {/* Dark Section: Header + Hero + Input */}
      <div className="hero-section">
        <div className="content-wrap">
          {/* Header */}
          <header className="header">
            <div className="header-brand">
              <div className="header-logo"><Bot size={22} color="var(--navy-900)" /></div>
              <div>
                <div className="header-title">BA Copilot</div>
                <div className="header-subtitle">Website Crawler & AI Story Generator</div>
              </div>
            </div>
            <div className={`ollama-badge ${ollamaOnline ? 'online' : 'offline'}`}>
              <span className={`status-dot ${ollamaOnline ? 'online' : 'offline'}`} />
              Ollama {ollamaOnline ? 'Online' : 'Offline'}
            </div>
          </header>

          {/* Hero */}
          <section className="hero">
            <h1>
              <span>AI assistant for</span>
              <span>automated user stories</span>
            </h1>
            <p>
              Transform any website URL into structured Jira user stories. 
              Discover functional requirements, capture UI states, and accelerate development.
            </p>
          </section>

          {/* URL Input */}
          <UrlInput onCrawl={handleCrawl} onStop={handleStopCrawl} isLoading={isLoading} />
          
          {/* Error */}
          {error && (
            <div className="error-badge">
              ⚠️ {error}
            </div>
          )}

          {/* Progress */}
          {status && (isLoading || status.status === 'done' || status.status === 'stopped') && (
            <ProgressTracker status={status} />
          )}
        </div>
      </div>

      {/* Light Section: Results */}
      <div className="main-content">
        <div className="content-wrap">
          {/* Results */}
          {pages.length > 0 ? (
            <>
              <div className="results-container">
                <PageList
                  pages={pages}
                  selectedIndex={selectedPage}
                  onSelect={setSelectedPage}
                />
                <div className="detail-panel">
                  {/* Screenshot */}
                  {currentPage?.screenshotPath && (
                    <div className="detail-card">
                      <div className="detail-card-body" style={{ padding: 12 }}>
                        <img
                          src={currentPage.screenshotPath}
                          alt={`Screenshot of ${currentPage.title}`}
                          className="screenshot-preview"
                        />
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <FeatureViewer features={currentPage?.features} />

                  {/* User Stories */}
                  <StoryPanel stories={currentStory} />
                </div>
              </div>

              {/* Export */}
              <ExportControls jobId={jobId} hasStories={stories.length > 0} />
            </>
          ) : (
            !isLoading && !error && (
              <div className="empty-state">
                <div className="empty-state-icon">🌐</div>
                <h3>Ready to Analyze</h3>
                <p>Enter a website URL above to begin the extraction process.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
