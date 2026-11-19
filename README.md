# Forge Project
# FORGE AI

An AI-powered computer-use assistant.

## Project Overview

FORGE AI understands natural language, plans tasks,
executes approved computer operations, and verifies results.

## Technology Stack

- React
- Node.js
- Express
- Groq API
- Python
- FastAPI
- Playwright
- OpenPyXL
- SQLite

## Team & Architectural Module Ownership

- **Bhuvan Batra — Backend & AI Lead**:
  - Designed and built the central Node.js/Express backend orchestration engine (`backend/src/server.js`).
  - Implemented the intent routing and classification pipeline (`intentRouter.js`) with LLM integration (Groq API & Ollama fallback).
  - Developed the task planner (`taskPlanner.js`) for multi-step structured Excel, document, and desktop operations.
  - Implemented the strict Security Gate policy middleware to intercept and block arbitrary terminal/shell commands (`securityGate.js`).
  - Authored the Human Approval Gate ensuring destructive or execution operations require explicit confirmation before execution.
  - Integrated the authenticated inter-service communication bridge with the Python automation service via `X-FORGE-TOKEN`.
  - Created SQLite state persistence for conversations, tasks, and audit logs.
  - Developed backend integration and unit test suites (`backend/tests/test-unit.js`, `backend/tests/test-api.js`).

- **Priyanshu — Python Automation Lead**:
  - Built the FastAPI automation runtime engine (`automation/src/main.py`).
  - Implemented sandboxed file system manipulation (`file_tool.py`) with path traversal guards.
  - Created Excel workbook and formula generation tools (`excel_tool.py`) using OpenPyXL.
  - Built desktop control and application resolution engines (`desktop_tool.py`).
  - Authored automation service unit and security tests (`automation/tests/test_automation_service.py`).

- **Vansh — Frontend Lead**:
  - Developed the React / Vite frontend UI (`frontend/src/`).
  - Created the real-time chat interface, task approval modal, and execution result viewer.
  - Built responsive glassmorphism theme and status indicators.

## Running Tests

### Backend Unit & Integration Tests (Node.js)
```bash
cd backend
npm test               # Runs backend/tests/test-api.js
node tests/test-unit.js # Runs unit and security gate tests
```

### Automation Service Tests (Python)
```bash
cd automation
pytest tests/test_automation_service.py -v
```

## Running the Complete System (Windows)
```powershell
.\start-forge.ps1
```
This launcher starts:
1. Python FastAPI Automation Runtime on `http://127.0.0.1:8000`
2. Node.js Express Backend on `http://127.0.0.1:3000`
3. React Vite Frontend on `http://127.0.0.1:5173`
