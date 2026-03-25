/**
 * API Routes - REST endpoints for crawling, analysis, and export.
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { crawlWebsite } = require('../services/crawlerService');
const { extractFeatures } = require('../services/extractorService');
const { generateUserStories, checkOllamaStatus } = require('../services/llmService');
const { exportStories } = require('../services/exportService');

const router = express.Router();

/** In-memory job store */
const jobs = new Map();

/**
 * POST /api/crawl - Start a crawl job
 * Body: { url: string, maxPages?: number }
 */
router.post('/crawl', async (req, res) => {
  const { url, maxPages = 20 } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try { new URL(url); } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const jobId = uuidv4();
  const job = {
    id: jobId,
    url,
    maxPages,
    status: 'crawling',
    progress: { crawled: 0, total: 0, phase: 'crawling' },
    pages: [],
    features: [],
    stories: [],
    createdAt: new Date().toISOString(),
    error: null
  };

  jobs.set(jobId, job);
  res.json({ jobId, status: 'started' });

  // Run crawl in background
  runJob(job);
});

/**
 * Background job runner: crawl → extract → LLM → done
 */
async function runJob(job) {
  try {
    // Phase 1: Crawl
    job.status = 'crawling';
    job.pages = await crawlWebsite(job.url, job.maxPages, (progress) => {
      if (job.status === 'stopped') return; // Stop progress updates
      job.progress = { ...progress, phase: 'crawling' };
    });

    if (job.status === 'stopped') return;

    // Phase 2: Extract features
    job.status = 'extracting';
    job.progress.phase = 'extracting';
    job.features = job.pages.map((page, i) => {
      if (job.status === 'stopped') return null;
      job.progress.current = i + 1;
      job.progress.total = job.pages.length;
      return extractFeatures(page);
    }).filter(Boolean);

    if (job.status === 'stopped') return;

    // Phase 3: Generate user stories via LLM
    job.status = 'analyzing';
    job.progress.phase = 'analyzing';
    for (let i = 0; i < job.features.length; i++) {
      if (job.status === 'stopped') break;
      job.progress.current = i + 1;
      job.progress.total = job.features.length;
      try {
        const stories = await generateUserStories(job.features[i]);
        job.stories.push(stories);
      } catch (err) {
        job.stories.push({
          page: job.features[i].metadata.url,
          title: job.features[i].metadata.title,
          features: [],
          error: err.message
        });
      }
    }

    if (job.status !== 'stopped') {
      job.status = 'done';
      job.progress.phase = 'done';
    }
  } catch (err) {
    if (job.status !== 'stopped') {
      job.status = 'error';
      job.error = err.message;
      console.error(`Job ${job.id} failed:`, err.message);
    }
  }
}

/**
 * GET /api/status/:jobId - Get job progress
 */
router.get('/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.json({
    id: job.id,
    url: job.url,
    status: job.status,
    progress: job.progress,
    pagesCount: job.pages.length,
    storiesCount: job.stories.length,
    error: job.error,
    createdAt: job.createdAt
  });
});

/**
 * POST /api/stop/:jobId - Stop a job
 */
router.post('/stop/:jobId', (req, res) => {
  const { jobId } = req.params;
  console.log(`🛑 Stopping job: ${jobId}`);
  const job = jobs.get(jobId);
  if (!job) {
    console.warn(`⚠️ Job ${jobId} not found for stop request`);
    return res.status(404).json({ error: 'Job not found' });
  }

  job.status = 'stopped';
  if (job.progress) job.progress.phase = 'stopped';
  res.json({ status: 'stopped' });
});

/**
 * GET /api/pages/:jobId - Get crawled pages with features
 */
router.get('/pages/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const pages = job.pages.map((page, i) => ({
    url: page.url,
    title: page.title,
    screenshotPath: page.screenshotPath,
    linksCount: page.links?.length || 0,
    features: job.features[i] || null
  }));

  res.json({ pages });
});

/**
 * GET /api/stories/:jobId - Get generated user stories
 */
router.get('/stories/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ stories: job.stories });
});

/**
 * POST /api/export - Export stories in specified format
 * Body: { jobId: string, format: 'json'|'csv'|'md'|'docx' }
 */
router.post('/export', async (req, res) => {
  const { jobId, format = 'json' } = req.body;

  const job = jobs.get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.stories.length === 0) return res.status(400).json({ error: 'No stories to export' });

  try {
    const result = await exportStories(job.stories, format);
    res.download(result.filepath, result.filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ollama-status - Check Ollama availability
 */
router.get('/ollama-status', async (req, res) => {
  const status = await checkOllamaStatus();
  res.json(status);
});

module.exports = router;
