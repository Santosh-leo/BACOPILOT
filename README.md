# AIAgent-BA

Website Crawler & User Story Generator powered by local LLM.

## Quick Start

### Prerequisites
- Node.js 18+
- Ollama installed with `gemma3:1b` model

### Setup Ollama
```bash
ollama pull gemma3:1b
ollama serve
```

### Start Backend
```bash
cd server
npm install
npm start
```

### Start Frontend
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Architecture
```
client/  → React + Vite frontend
server/  → Express + Playwright backend
  ├── services/crawlerService.js   → Website crawling
  ├── services/extractorService.js → Feature extraction
  ├── services/llmService.js       → Ollama LLM integration
  └── services/exportService.js    → JSON/CSV/MD/DOCX export
```

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/crawl | Start crawl job |
| GET | /api/status/:id | Poll job progress |
| GET | /api/pages/:id | Get crawled pages |
| GET | /api/stories/:id | Get user stories |
| POST | /api/export | Export stories |
