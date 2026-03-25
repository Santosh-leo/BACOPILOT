# AIAgent-BA — Build Walkthrough

## What Was Built

A production-grade website crawler & user story generator per the [Agent.md](file:///c:/Users/SANTOSH/AIAgent-BA/DesignDocs/Agent.md) specification, following [Rulebook.md](file:///c:/Users/SANTOSH/AIAgent-BA/DesignDocs/Rulebook.md) standards.

### Backend (Express + Playwright + Ollama)
| File | Purpose |
|------|---------|
| [index.js](file:///c:/Users/SANTOSH/AIAgent-BA/server/src/index.js) | Express server entry |
| [api.js](file:///c:/Users/SANTOSH/AIAgent-BA/server/src/routes/api.js) | REST endpoints (crawl, status, pages, stories, export) |
| [crawlerService.js](file:///c:/Users/SANTOSH/AIAgent-BA/server/src/services/crawlerService.js) | Playwright crawler with queue-based page discovery |
| [extractorService.js](file:///c:/Users/SANTOSH/AIAgent-BA/server/src/services/extractorService.js) | DOM → structured feature extraction |
| [llmService.js](file:///c:/Users/SANTOSH/AIAgent-BA/server/src/services/llmService.js) | Ollama/Gemma 3:1b integration |
| [exportService.js](file:///c:/Users/SANTOSH/AIAgent-BA/server/src/services/exportService.js) | JSON, CSV, Markdown, DOCX export |

### Frontend (React 18 + Vite)
| Component | Purpose |
|-----------|---------|
| [App.jsx](file:///c:/Users/SANTOSH/AIAgent-BA/client/src/App.jsx) | Main orchestrator with polling |
| [UrlInput.jsx](file:///c:/Users/SANTOSH/AIAgent-BA/client/src/components/UrlInput.jsx) | URL input + max pages config |
| [ProgressTracker.jsx](file:///c:/Users/SANTOSH/AIAgent-BA/client/src/components/ProgressTracker.jsx) | Phase dots + progress bar |
| [PageList.jsx](file:///c:/Users/SANTOSH/AIAgent-BA/client/src/components/PageList.jsx) | Sitemap sidebar |
| [FeatureViewer.jsx](file:///c:/Users/SANTOSH/AIAgent-BA/client/src/components/FeatureViewer.jsx) | Extracted elements grid |
| [StoryPanel.jsx](file:///c:/Users/SANTOSH/AIAgent-BA/client/src/components/StoryPanel.jsx) | User stories by feature |
| [ExportControls.jsx](file:///c:/Users/SANTOSH/AIAgent-BA/client/src/components/ExportControls.jsx) | Download buttons |

---

## Verification

✅ Backend starts on `http://localhost:3001`
✅ Frontend starts on `http://localhost:5173`
✅ Ollama detected as online
✅ UI renders with all components

![Application Home Page](C:\Users\SANTOSH\.gemini\antigravity\brain\3067b07a-7487-4a06-a412-84c6d5aabf09\aiagent_ba_home_page_1774460904340.png)

## How to Use

1. Ensure Ollama is running: `ollama serve` with `gemma3:1b` model
2. Start backend: `cd server && npm start`
3. Start frontend: `cd client && npm run dev`
4. Open `http://localhost:5173`
5. Enter a URL → click **Start Crawl**
6. Watch progress → view features → read stories → export
