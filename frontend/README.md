# FORGE AI — Autonomous Computer-Use Frontend

The official React client application for **FORGE AI**, an autonomous AI-powered computer-use assistant built for offline-first local execution, deterministic multi-step planning, human-in-the-loop authorization gates, and post-execution output verification.

Developed and maintained by **Vansh** (Frontend Lead) as part of the FORGE engineering team.

---

## 1. Project Overview & Workflow Pipeline

FORGE AI is not a generic chatbot. It is an autonomous desktop operations assistant that operates through a strict 7-stage deterministic workflow:

```text
UNDERSTAND  ──▶  PLAN  ──▶  APPROVE  ──▶  EXECUTE  ──▶  VERIFY  ──▶  STORE  ──▶  LEARN
```

1. **UNDERSTAND**: Parses prompt requirements, security restrictions, and determines whether external network access is needed.
2. **PLAN**: Synthesizes a sequential execution DAG using registered tools (`excel_writer`, `file_system`, `document_parser`, `browser_runner`).
3. **APPROVE**: Human-in-the-loop authorization gate. Execution pauses and requires explicit operator sign-off before modifying disk state.
4. **EXECUTE**: Dispatches authorized steps to the local Python / Playwright execution sandbox.
5. **VERIFY**: Cryptographically validates output integrity (file hashes, schema compliance, formula evaluations).
6. **STORE**: Persists execution logs and telemetry authoritatively into SQLite via Bhuvan's Express backend.
7. **LEARN**: Indexes successful procedural workflow recipes for future in-context prompt retrieval (without mutating model weights).

---

## 2. Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Routing**: [React Router v7](https://reactrouter.com/) (Browser client routing)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Design Tokens**: Linear & Raycast inspired deep graphite palette (`#090B10`, `#0C0E14`, `#10141D`) with subtle ice cyan (`#77D9E8`) and atmospheric blue (`#6EA8FF`) accents, selective glassmorphism, and precision monospace typography.
- **Brand Identity**: Original custom geometric SVG mark representing structured computational intelligence and deterministic anvil execution.

---

## 3. Directory Structure

```text
frontend/
├── public/
│   └── favicon.svg             # Custom geometric FORGE brand mark SVG
├── src/
│   ├── assets/                 # Static images and icons
│   ├── components/
│   │   ├── chat/               # ChatMessage, SuggestedTasks, PlanApprovalCard, TaskProgressTimeline, MessageComposer
│   │   ├── common/             # ForgeLogo, Badge, Button, Card, Modal, StatusIndicator
│   │   ├── dashboard/          # SystemStatusBar, Environment telemetry
│   │   ├── files/              # FileCard, FileFilterBar
│   │   ├── history/            # TaskHistoryTable, TaskFilterBar, TaskDetailModal
│   │   ├── memory/             # MemoryExplanationBanner, ExperienceCard
│   │   └── settings/           # ProviderSettings, BackendConnectionCard, OfflinePolicyCard, PreferencesCard
│   ├── context/
│   │   ├── SystemContext.jsx   # Online/offline state, AI provider, backend telemetry, airgap policy
│   │   └── TaskContext.jsx     # Active task lifecycle, pipeline simulation, chat stream, approval gates
│   ├── hooks/
│   │   ├── useSystem.js        # Easy access hook for SystemContext
│   │   └── useTasks.js         # Easy access hook for TaskContext
│   ├── layouts/
│   │   ├── AppLayout.jsx       # Persistent responsive frame
│   │   ├── Header.jsx          # Breadcrumbs, environment status pills, dev mode indicators
│   │   └── Sidebar.jsx         # FORGE brand identity, navigation routes, hardware footer
│   ├── pages/
│   │   ├── WorkspacePage.jsx   # Primary autonomous workspace, chat stream, live timeline, approval card
│   │   ├── HistoryPage.jsx     # SQLite task history table, filter bar, detail inspection modal
│   │   ├── MemoryPage.jsx      # Procedural experience store, pattern cards, architecture banner
│   │   ├── FilesPage.jsx       # Generated artifacts registry, file cards, inspection modal
│   │   ├── SettingsPage.jsx    # Inference provider selection, backend URL health test, airgap rules
│   │   └── NotFoundPage.jsx    # 404 fallback
│   ├── services/
│   │   ├── api.js              # Central HTTP client with configurable base URL and timeout
│   │   ├── fileService.js      # Artifact retrieval and download stream handler
│   │   ├── memoryService.js    # Experience pattern retrieval and deletion
│   │   ├── mockData.js         # Standalone realistic simulation dataset
│   │   ├── systemService.js    # Health check probe and latency tester
│   │   └── taskService.js      # Task creation, lifecycle transitions, history queries
│   ├── styles/
│   │   └── index.css           # Global theme variables, animations, custom scrollbars
│   ├── utils/
│   │   ├── constants.js        # Workflow stages, AI providers, connection modes, storage keys
│   │   └── formatters.js       # Date, duration, file size formatters, status badge styles, cn()
│   ├── App.jsx                 # Top-level providers and router configuration
│   └── main.jsx                # Application DOM entry point
├── .env.example                # Base template for local environment variables
├── .gitignore                  # Git safety configuration (excludes node_modules, dist, .env)
├── index.html                  # HTML entry point with dark theme and SEO meta
├── package.json                # Project dependencies and script commands
├── README.md                   # Comprehensive technical documentation
└── vite.config.js              # Vite configuration with React and Tailwind v4 plugins
```

---

## 4. Getting Started & Installation

### Prerequisites
- **Node.js**: v20+ or v24+
- **npm**: v10+

### Setup Instructions
1. Navigate into the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open your browser at:
   ```text
   http://localhost:5173
   ```

---

## 5. Production Build & Linting

- **Run Production Build**:
  ```bash
  npm run build
  ```
  Generates optimized, minified assets into `dist/`.

- **Preview Production Build Locally**:
  ```bash
  npm run preview
  ```

- **Run Fast Code Linting**:
  ```bash
  npm run lint
  ```

---

## 6. Environment Variables

Configure via `frontend/.env`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:5000` | Target URL for Bhuvan's Express backend API |
| `VITE_USE_MOCK` | `true` | When `true`, activates the standalone mock service layer for isolated frontend development |
| `VITE_API_TIMEOUT` | `10000` | HTTP request timeout in milliseconds |

---

## 7. Standalone Mock vs Real Backend Integration

### Standalone Mock Mode (`VITE_USE_MOCK=true`)
When working without Bhuvan's Express server or Ollama active:
- The UI automatically renders a subtle **Dev Preview / Standalone Mock** banner.
- All 7 stages (`UNDERSTAND` through `LEARN`) simulate realistic timings, log messages, and verification metrics.
- The approval gate pauses execution and demands an operator decision (`Authorize & Execute` or `Decline & Abort`).
- Pre-populated realistic records are provided for task history, generated workbooks, and experience patterns.

### Transitioning to Live Backend (`VITE_USE_MOCK=false`)
The frontend is built with a decoupled service layer. When Bhuvan starts the Express server on `http://localhost:5000`, the frontend automatically calls the corresponding endpoints:

| Endpoint | Method | Expected Payload / Response | Status |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | `{ status: "ok", uptime: number }` | Ready to connect |
| `/api/system/status` | `GET` | Backend telemetry, SQLite status, Ollama model availability | Ready to connect |
| `/api/tasks` | `POST` | `{ prompt, provider }` -> Returns new task object | Ready to connect |
| `/api/tasks` | `GET` | Returns list of historical tasks from SQLite | Ready to connect |
| `/api/tasks/:id/approve` | `POST` | `{ decision: "approved" \| "rejected", notes: string }` | Ready to connect |
| `/api/files` | `GET` | Returns array of produced artifacts | Ready to connect |
| `/api/files/:id/download`| `GET` | Stream of generated file from disk | Ready to connect |
| `/api/memory` | `GET` | Returns array of indexed procedural patterns | Ready to connect |
| `/api/memory/:id` | `DELETE`| Removes pattern from memory store | Ready to connect |

---

## 8. Data Storage & Architecture Principles

- **No Fake Persistent Memory**: Browser `localStorage` is strictly restricted to non-sensitive UI settings (theme preferences, airgap network mode). It is never used to masquerade as the AI's long-term memory.
- **Authoritative History**: All authoritative execution records, verification metrics, and audit logs belong in SQLite on the backend.
- **No Weight Alteration**: Storing task history does not fine-tune or modify local LLM weights. Experience is utilized strictly through in-context procedural retrieval.
- **Airgap Enforced Policy**: When Offline Airgap mode is selected, the frontend strictly blocks requests containing external web keywords or browser scraping actions.

---

## 9. Current Limitations & Next Steps with Team

- **Ollama Host Connection**: The frontend UI allows selecting local models (`llama3:8b`, `qwen2.5:7b`), but local Ollama execution is orchestrated by the backend server.
- **Direct File Downloads**: In mock mode, the file inspector displays the exact recorded file location and manifest metadata; real binary streams require the backend `/api/files/:id/download` route.
- **Python Playwright Engine**: Automation execution is managed by Priyanshu on the backend; the frontend communicates exclusively via HTTP to the Express API.
