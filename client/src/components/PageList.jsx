import { FileText, Link, Layers } from 'lucide-react';

/**
 * Page List - Sidebar showing crawled pages as a sitemap.
 */
export default function PageList({ pages, selectedIndex, onSelect }) {
  if (!pages || pages.length === 0) return null;

  return (
    <div className="page-list">
      <div className="page-list-header">
        <h3>Sitemap</h3>
        <span className="page-count">{pages.length} pages</span>
      </div>
      <div className="page-list-items">
        {pages.map((page, i) => (
          <div
            key={page.url}
            className={`page-item ${i === selectedIndex ? 'active' : ''}`}
            onClick={() => onSelect(i)}
          >
            <div className="page-item-title">{page.title || 'Untitled'}</div>
            <div className="page-item-url">{page.url}</div>
            <div className="page-item-meta">
              <span className="page-meta-tag">
                <Link size={11} /> {page.linksCount} links
              </span>
              <span className="page-meta-tag">
                <Layers size={11} /> {page.features?.interactive_elements?.length || 0} elements
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
