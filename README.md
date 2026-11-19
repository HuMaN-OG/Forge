# ⚡ FORGE AI
### Your AI-powered assistant for real computer work.

**From natural language to real desktop actions.**

FORGE AI is an AI-powered computer-use assistant that transforms everyday instructions into practical desktop workflows. It understands what you want to accomplish, plans the steps, executes approved computer operations, and verifies the results.

Instead of simply telling you *how* to do something, FORGE aims to help you **get it done**.

---

## ✨ What is FORGE?

FORGE bridges the gap between conversational AI and real-world computer interaction.

Give it a task in natural language. FORGE interprets your intent, determines the required actions, and uses its automation system to interact with your computer.

Whether you're opening applications, working with files, or automating a multi-step task, FORGE is designed to make computer use more natural and efficient.

> **Your computer. Your instructions. Your AI-powered workflow.**

---

## 🚀 Key Features

- **Natural Language Task Understanding**  
  Describe what you want to do using everyday language.

- **AI-Powered Task Planning**  
  Breaks requests into actionable steps.

- **Real Desktop Automation**  
  Interacts with desktop applications to perform supported computer operations.

- **Windows Application Launching**  
  Resolves and launches installed applications, shortcuts, and supported Windows apps.

- **File and Document Workflows**  
  Create, edit, save, and manage supported files through automation.

- **Multi-Format Document Support**  
  Work with supported document formats, including spreadsheet and presentation workflows.

- **Task Progress and Result Verification**  
  Tracks execution and checks results where supported.

- **Permission-Aware Execution**  
  Designed around approved operations and controlled tool access.

---

## 🧠 How It Works

```text
        User Instruction
               │
               ▼
     Natural Language Understanding
               │
               ▼
        AI Task Planning
               │
               ▼
      Backend Orchestration
               │
               ▼
       Python Automation
               │
               ▼
    Desktop Apps / Files / UI
               │
               ▼
       Result Verification
               │
               ▼
        User-Facing Result
```

FORGE combines an interactive frontend, backend orchestration, AI services, and a Python automation layer to connect user intent with desktop actions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| AI | Groq API, Ollama |
| Automation Service | Python, FastAPI |
| Browser Automation | Playwright |
| Spreadsheet Processing | OpenPyXL |
| Database | SQLite |

---

## 💡 Example Tasks

```text
"Open Notepad and write a project update."

"Create a document and save it to my Desktop."

"Open an installed application."

"Help me organize files in a folder."

"Create or update a spreadsheet using the information I provide."
```

*Supported actions depend on the installed application, available tools, and execution permissions.*

---

## 🏗️ Project Structure

```text
Forge/
├── frontend/       # React user interface
├── backend/        # Node.js API and orchestration
└── automation/     # Python desktop automation service
```

## Run locally (Windows)

FORGE consists of three services. Run each in a separate PowerShell terminal. The desktop automation layer depends on Windows libraries.

**Python automation service**

```powershell
cd automation
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:FORGE_AUTOMATION_TOKEN = "choose-a-local-secret"
python -m uvicorn src.main:app --host 127.0.0.1 --port 8000
```

Check `http://127.0.0.1:8000/health`.

**Node.js backend**

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm start
```

Edit `backend/.env` to set `FORGE_AUTOMATION_TOKEN` to the exact same secret used by the automation service and `PYTHON_AUTOMATION_URL=http://127.0.0.1:8000`. The backend defaults to `http://127.0.0.1:3000`; its health endpoint is `/health`. Ollama is optional for startup; a rules-based fallback is documented in the server.

**Frontend**

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Never commit real API keys or tokens.

## Demonstration and contributions

The repository contains the React frontend, Node.js orchestration backend, and Python automation layer. My resume describes my integration work and permission-aware execution workflow; it does not claim sole authorship of every component.

To demonstrate the system, capture actual screens for (1) task submission, (2) approval before execution, and (3) verified completion. **Real screenshots have not been added here yet.** Keep private files, credentials, and personal data out of screenshots. Do not represent mockups as evidence of a running application.

---

## 🎯 Our Vision

We believe the next generation of AI should do more than generate answers.

It should help people interact with their computers, complete repetitive work, and turn ideas into actions through simple conversations.

**FORGE AI — Make your computer work with you.**

---

*Built with curiosity, engineering, and the belief that computing can be more intuitive.*
