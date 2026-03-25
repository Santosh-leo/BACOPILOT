You are a Senior Software Engineer with 15+ years of experience in full-stack development, specializing in React (Vite), Node.js (Express), browser automation (Playwright), and LLM-based systems.

Your task is to design and implement a production-grade application that automatically crawls websites, extracts UI/UX features, and generates structured user stories using a local LLM.

## 🧱 Tech Stack
- Frontend: React 18 + Vite
- Backend: Node.js + Express
- Automation Layer: Playwright (MCP-style orchestration)
- LLM Layer: Local Ollama (Gemma 3:1b)
- Storage: JSON + optional export (CSV, Markdown, DOCX)

## 🎯 Product Goal
Build a UI similar to:
https://project-01-local-llmt-est-generator-kkqjlncdn.vercel.app/

The app should allow users to:
1. Input a website URL
2. Crawl the entire site
3. Extract features from each page
4. Generate user stories using LLM
5. Export structured outputs

---

# 🧩 System Architecture
Design a modular system with:
- Frontend (React UI)
- Backend API (Express)
- Crawling Service (Playwright workers)
- LLM Service (Ollama wrapper)
- Storage/Export Service

Clearly define:
- Folder structure
- API contracts
- Data flow between services

---

# ⚙️ Functional Phases

## Phase 1: Page Discovery & Crawling
Implement Playwright automation to:

- Navigate to each page URL
- Capture full-page screenshots
- Extract DOM elements:
  - Buttons
  - Forms (inputs, selects, checkboxes)
  - Navigation links
  - Modals / dialogs
  - CTAs
- Discover internal links:
  - Collect all <a href> values
  - Normalize URLs
  - Build a sitemap (avoid duplicates)
- Handle authentication:
  - Support login flows (form-based)
  - Persist session/cookies

Return structured data:
{
  url,
  title,
  screenshot_path,
  dom_snapshot,
  links: []
}

---

## Phase 2: Feature Extraction
For each crawled page, process and extract:

- Page metadata (title, URL)
- Interactive elements:
  - Buttons (text, role, action hints)
  - Inputs (type, placeholder, validation hints)
  - Dropdowns, modals
- Navigation structure
- Content sections:
  - Hero sections
  - Product cards
  - Lists, filters
- Error/empty states:
  - Disabled buttons
  - Empty lists
  - Error messages

Output structured JSON per page:
{
  metadata: {},
  interactive_elements: [],
  navigation: [],
  sections: [],
  states: []
}

---

## Phase 3: LLM Analysis & User Story Generation

Use Ollama (Gemma 3:1b) to process:
- DOM snapshot
- Extracted structured data
- Screenshot (optional base64 or reference)

Prompt template:

"Given this page’s HTML structure and screenshot, identify all distinct features.
Generate user stories in the format:

As a [user],
I want to [action],
so that [benefit].

Group stories by feature area.
Be concise but comprehensive.
Avoid duplicates.
Focus on real user intent."

Expected output:
{
  page: "",
  features: [
    {
      name: "",
      user_stories: []
    }
  ]
}

---

## Phase 4: Output & Export

Implement:
- Store results per page:
  - JSON files
  - Markdown summaries
- Export options:
  - CSV (rows = user stories)
  - DOCX (formatted document)
  - Jira/Notion-ready format

---

# 🖥️ Frontend Requirements (React + Vite)

Build a UI similar to the reference app with:

### Core Components:
- URL Input Form
- Crawl Progress Tracker
- Page List / Sitemap View
- Feature Extraction Viewer
- User Stories Panel
- Export Controls

### UX Expectations:
- Clean, modern UI
- Real-time updates (WebSocket or polling)
- Status indicators (crawling, analyzing, done)
- Expandable sections per page

---

# 🔌 Backend API Design

Provide endpoints:

POST /crawl
GET /status
GET /pages
GET /stories
POST /export

---

# 🧠 LLM Integration

Implement:
- Ollama client wrapper
- Streaming or batch inference
- Prompt templating
- Token optimization (since Gemma 1B is small)

---

# ⚡ Performance Considerations

- Parallel crawling (queue-based)
- Rate limiting
- Deduplication of URLs
- Incremental processing

---

# 🛡️ Edge Cases

- Infinite loops in crawling
- Auth-protected pages
- JS-heavy SPAs
- Broken links
- Large DOM handling

---

# 📦 Deliverables

Provide:

1. Full folder structure
2. Backend implementation (Express + Playwright)
3. Frontend implementation (React + Vite)
4. LLM integration code (Ollama)
5. Example prompts & outputs
6. Sample exported file
7. Setup instructions

---

# 🎯 Coding Standards

- Clean, modular, production-ready code
- Use async/await properly
- Add comments for complex logic
- Follow best practices for React + Node

---

# 🚀 Output Format

Respond with:

1. High-level architecture
2. Step-by-step implementation
3. Complete code snippets per module
4. Clear explanation of data flow

Do NOT skip implementation details.
Act like you are building a real production system.