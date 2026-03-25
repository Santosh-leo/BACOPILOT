/**
 * API Service - Fetch wrappers for backend endpoints
 */
const BASE = '';

/** Start a crawl job */
export async function startCrawl(url, maxPages = 1) {
  const res = await fetch(`${BASE}/api/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, maxPages })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Crawl failed');
  return res.json();
}

/** Stop a crawl job */
export async function stopCrawl(jobId) {
  const res = await fetch(`${BASE}/api/stop/${jobId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to stop crawl');
  return res.json();
}

/** Poll job status */
export async function getStatus(jobId) {
  const res = await fetch(`${BASE}/api/status/${jobId}`);
  if (!res.ok) throw new Error('Status check failed');
  return res.json();
}

/** Get crawled pages */
export async function getPages(jobId) {
  const res = await fetch(`${BASE}/api/pages/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
}

/** Get generated user stories */
export async function getStories(jobId) {
  const res = await fetch(`${BASE}/api/stories/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

/** Export stories in specified format */
export async function exportStories(jobId, format) {
  const res = await fetch(`${BASE}/api/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, format })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(err.error || 'Export failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const ext = { json: 'json', csv: 'csv', md: 'md', docx: 'docx' }[format] || 'json';
  const a = document.createElement('a');
  a.href = url;
  a.download = `user_stories.${ext}`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/** Check Ollama status */
export async function getOllamaStatus() {
  try {
    const res = await fetch(`${BASE}/api/ollama-status`);
    return res.json();
  } catch {
    return { available: false };
  }
}
