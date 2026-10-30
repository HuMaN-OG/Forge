# FORGE AI — Backend Service

**Lead:** Bhuvan Batra (Backend & AI Lead)
**Port:** `http://127.0.0.1:3000`
**AI Engine:** Local Ollama (`qwen3:4b` on RTX 3050 GPU)
**Database:** SQLite (`data/forge.db` via `node:sqlite`)

---

## Architecture Overview

```
Frontend (Vansh - :5173) ──> POST /api/v1/chat ──> Backend (Bhuvan - :3000)
                                                        │
                      ┌─────────────────────────────────┼──────────────────────────────┐
                      ▼                                 ▼                              ▼
            Ollama (Qwen3 4B)                   SQLite Persistence             Python Automation
            (127.0.0.1:11434)                   (data/forge.db)                (Priyanshu - :8000)
            • Intent Classifier                 • Tasks table                  • excel_writer
              - CHAT                            • Messages table               • file_system
              - TASK                            • Intent audit logs            • STRICT NO SHELL
              - AMBIGUOUS
```

---

## Quickstart

### 1. Install & Configure
```bash
cd backend
npm install
cp .env.example .env
```

Ensure Ollama is running locally with Qwen3 4B:
```bash
ollama run qwen3:4b
```

### 2. Run Backend
```bash
# Development (with nodemon):
npm run dev

# Production:
npm start
```

### 3. Run Test Suite
```bash
# Run unit & schema tests:
node tests/test-unit.js

# Run full live API integration tests:
npm test
```

---

## API Contract Specification (For Vansh / Frontend)

Backend base URL: `http://127.0.0.1:3000`

### 1. Health Endpoint
- **URL:** `GET /health` or `GET /api/v1/health`
- **Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-30T13:00:00.000Z",
  "uptimeSeconds": 120,
  "services": {
    "server": { "status": "healthy", "host": "127.0.0.1", "port": 3000 },
    "database": { "status": "healthy", "path": ".../data/forge.db" },
    "ollama": { "status": "healthy", "available": true, "targetModel": "qwen3:4b", "hasTargetModel": true },
    "pythonAutomation": { "status": "healthy" }
  }
}
```

### 2. Chat & Task Initiation Endpoint
- **URL:** `POST /api/v1/chat`
- **Request Body:**
```json
{
  "message": "Create an Excel sheet named quarterly_sales.xlsx with Q1-Q4 revenue figures.",
  "conversationId": "session-123",
  "provider": "Ollama (qwen3:4b)"
}
```

- **Response (When Intent = TASK):**
```json
{
  "success": true,
  "intent": "TASK",
  "confidence": 0.95,
  "status": "waiting_approval",
  "reply": "I have formulated a structured execution plan for your request...",
  "task": {
    "id": "task-049220",
    "title": "Generate Structured Excel Workbook",
    "prompt": "Create an Excel sheet named quarterly_sales.xlsx...",
    "status": "WAITING_APPROVAL",
    "type": "offline",
    "provider": "Ollama (qwen3:4b)",
    "plannedTool": "excel_writer",
    "approvalRequired": true,
    "approvalStatus": "pending",
    "approvalDetails": {
      "action": "Execute registered tool: excel_writer",
      "target": "Create and format Excel workbook with computed formulas at ./generated/output.xlsx",
      "riskLevel": "Low (Restricted Local Directory Sandbox)",
      "explanation": "FORGE AI requires your explicit authorization before calling 'excel_writer'."
    },
    "steps": [
      { "id": "s1", "stage": "UNDERSTAND", "status": "completed", "message": "Requirement parsed." },
      { "id": "s2", "stage": "PLAN", "status": "completed", "message": "Plan formulated." },
      { "id": "s3", "stage": "APPROVE", "status": "in_progress", "message": "Awaiting operator approval." },
      { "id": "s4", "stage": "EXECUTE", "status": "pending", "message": "Dispatch tool action." },
      { "id": "s5", "stage": "VERIFY", "status": "pending", "message": "Validate output integrity." },
      { "id": "s6", "stage": "STORE", "status": "pending", "message": "Persist to SQLite." },
      { "id": "s7", "stage": "LEARN", "status": "pending", "message": "Index pattern." }
    ],
    "artifacts": [{ "name": "output.xlsx", "size": 24500, "type": "excel", "path": "./generated/output.xlsx" }],
    "createdAt": "2026-10-30T13:00:00.000Z"
  },
  "clarificationQuestion": null,
  "metadata": {
    "model": "Ollama (qwen3:4b)",
    "executionTimeMs": 1250,
    "timestamp": "2026-10-30T13:00:00.000Z"
  }
}
```

- **Response (When Intent = CHAT):**
```json
{
  "success": true,
  "intent": "CHAT",
  "confidence": 0.95,
  "status": "completed",
  "reply": "Hello! I am FORGE AI, your local computer-use assistant...",
  "task": null,
  "clarificationQuestion": null
}
```

- **Response (When Intent = AMBIGUOUS):**
```json
{
  "success": true,
  "intent": "AMBIGUOUS",
  "confidence": 0.85,
  "status": "requires_clarification",
  "reply": "Which files do you want to fix? Please specify paths and actions.",
  "task": null,
  "clarificationQuestion": "Which files do you want to fix? Please specify paths and actions."
}
```

- **Response (When Arbitrary Shell Execution is Attempted):**
```json
{
  "success": false,
  "intent": "TASK",
  "confidence": 1.0,
  "status": "security_blocked",
  "reply": "Security Gate Notice: Arbitrary terminal or shell command execution is strictly disallowed by FORGE AI policy. Only pre-registered, sandboxed tools are executed with explicit operator confirmation.",
  "task": null
}
```

### 3. Task Management Endpoints
- `GET /api/v1/tasks`: List all tasks (optional query `?status=WAITING_APPROVAL&search=excel`)
- `GET /api/v1/tasks/:id`: Get full task detail
- `POST /api/v1/tasks/:id/approve`: Approve task (transitions status to `EXECUTING`)
- `POST /api/v1/tasks/:id/reject`: Reject task (transitions status to `REJECTED`)
- `GET /api/v1/messages`: Fetch conversation message history

---

## Registered Tool Interface (For Priyanshu / Automation)

FastAPI Automation Service Base URL: `http://127.0.0.1:8000`

### Endpoints
- `GET /health`: Health status and list of registered tools (`excel_writer`, `file_system`)
- `POST /tools/execute`: Dispatches tool call

### Request Schema:
```json
{
  "tool": "excel_writer",
  "taskId": "task-049220",
  "params": {
    "action": "create_workbook",
    "filePath": "quarterly_sales.xlsx",
    "sheetName": "Sales",
    "headers": ["Department", "Q1", "Q2", "Q3", "Q4", "Total"]
  }
}
```

### Security Policy:
- Arbitrary terminal command execution (bash, sh, cmd, powershell, exec, subprocess) is **strictly forbidden**.
- All file operations are sandboxed within the configured workspace directory.
