# FORGE AI — Windows local viva runbook

This is a **local automation demo**, not a cloud deployment. Ollama runs on the laptop; Node.js and Python listen on localhost. This repository does not provide a remotely usable copy of your computer.

## Preparation

1. Install [Python 3.11](https://www.python.org/downloads/), [Node.js 22 LTS](https://nodejs.org/), and [Ollama for Windows](https://ollama.com/download/windows). The launcher creates `automation/.venv` and installs dependencies when required.
2. Install the model **before** the viva while connected to the internet:
   ```powershell
   ollama pull qwen3:4b
   ollama list
   ```
3. In the FORGE root directory, launch PowerShell and run:
   ```powershell
   .\start-forge.ps1
   ```
   If execution policy blocks scripts, use `powershell -NoProfile -ExecutionPolicy Bypass -File .\start-forge.ps1` in a trusted local shell.
4. Open **http://127.0.0.1:5173**. Confirm **Backend Connected**, **Automation available**, and **Ollama ready**. `Offline` Ollama means a **rule-based fallback**, not local AI model execution.

## End-to-end verification

Run this after the launcher reports ready:

```powershell
.\tools\local-viva-smoke.ps1
```

This makes a new uniquely named folder inside `workspace_sandbox` **only after** calling the real approval endpoint. It checks the task was not executed prematurely and that the folder exists afterward. It does not use mocked results. The no-write health mode is `.\tools\local-viva-smoke.ps1 -NoWrite`.

## Demonstrate in front of the examiner

1. Open **Workspace**. Say: *"Create a folder called VivaDemo"*.
2. Show the pending plan and its target: `workspace_sandbox/VivaDemo`. **Do not approve before discussing the security gate.**
3. Approve; inspect the created folder in the local workspace.
4. Ask: *"Create an Excel spreadsheet named VivaSales.xlsx with columns Item and Amount containing Laptop 25000, Mouse 500, Keyboard 1000, and total."* Review the proposed rows and `=SUM(B2:B4)` calculation before approving. FORGE uses only the numbers you provide; it does not invent a dataset or act as a general spreadsheet agent.
5. Open Task History to show status changes and records. Verify any generated files on disk.
6. Explain the architecture: **local natural-language routing (rules/Ollama) → task planner → human approval → authenticated Node-to-Python tool call → sandbox file → SQLite task history**.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Port 3000/8000/5173 in use | Stop *your own* old FORGE session with `.\stop-forge.ps1` or identify the process; launcher never kills unknown port owners |
| Missing dependencies | Rerun `.\start-forge.ps1` without `-SkipInstall`; check `logs/*.err.log` |
| Ollama offline | Open Ollama, then `ollama list`; `ollama pull qwen3:4b` if model missing |
| Model says offline but tasks can be planned | Regex/rule fallback works; be clear that this does **not** demonstrate Ollama inference |
| Python authentication 401 | Stop with `.\stop-forge.ps1`, then restart so both services inherit the same ephemeral token |
| Frontend says Mock | Check `frontend/.env`: `VITE_USE_MOCK=false`; restart Vite after changes |
| Workbook not created | Inspect the approval card and `logs/python.err.log`; try the simpler folder demo |
| Service died | Do not assume all green; run `.\tools\local-viva-smoke.ps1 -NoWrite` |

### Boundaries

- Do not ask FORGE to modify personal or university files during the demonstration. Stay inside `workspace_sandbox`.
- No global terminal/shell execution is provided by FORGE's task tools.
- Destructive operations require approval. Do not share `FORGE_AUTOMATION_TOKEN` or internal logs.
- The startup script generates a **new in-memory shared token** for Node and Python. Existing services using another token are deliberately *not* silently reused.
- The local model can answer conversational requests when available; common actions use deterministic, explainable planning paths.
- For production, stronger isolation, authentication of the browser UI, monitoring, and a security review are required.

Stop local FORGE services with:

```powershell
.\stop-forge.ps1
```
