import { FileJson, FileSpreadsheet, FileText, File } from 'lucide-react';
import { exportStories } from '../services/api';

const FORMATS = [
  { key: 'json', label: 'JSON', icon: FileJson },
  { key: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { key: 'md', label: 'Markdown', icon: FileText },
  { key: 'docx', label: 'DOCX', icon: File }
];

/**
 * Export Controls - Download buttons for various export formats.
 */
export default function ExportControls({ jobId, hasStories }) {
  if (!hasStories) return null;

  const handleExport = async (format) => {
    try {
      await exportStories(jobId, format);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="export-controls">
      {FORMATS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className="export-btn"
          onClick={() => handleExport(key)}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
