import { Globe } from 'lucide-react';

/**
 * URL Input Form - Accepts website URL and max pages for crawling.
 */
export default function UrlInput({ onCrawl, onStop, isLoading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const url = form.get('url')?.trim();
    const maxPages = parseInt(form.get('maxPages')) || 1;
    if (url) onCrawl(url, maxPages);
  };

  return (
    <div className="url-input-container">
      <form onSubmit={handleSubmit}>
        <div className="url-input-wrapper">
          <div className="url-input-icon">
            <Globe size={18} />
          </div>
          <input
            type="url"
            name="url"
            className="url-input"
            placeholder="Enter website URL (e.g., https://example.com)"
            required
            disabled={isLoading}
          />
          <input
            type="number"
            name="maxPages"
            className="max-pages-input"
            defaultValue={1}
            min={1}
            max={100}
            title="Max pages to crawl"
            disabled={isLoading}
          />
          <div className="input-actions">
            {isLoading ? (
              <button type="button" className="stop-btn" onClick={onStop}>
                Stop Crawl
              </button>
            ) : (
              <button type="submit" className="crawl-btn">
                Start Crawl
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
