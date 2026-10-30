# FORGE AI — Python Automation Service (FastAPI)

Lead: Priyanshu (Python Automation Lead)

This is the local Python automation engine for **FORGE AI**. It runs on `127.0.0.1:8000` and executes registered computer-use tool operations in a safe local workspace sandbox.

## Key Principles & Security Rules
- **No Arbitrary Terminal Execution**: Arbitrary terminal commands, shell scripts, `bash`, `cmd`, `powershell`, `eval`, or `subprocess` execution are **strictly prohibited** by design.
- **Registered Tools Only**: Only pre-registered, audited tool handlers (`excel_writer`, `file_system`) are supported.
- **Workspace Sandboxing**: File operations are confined to `./workspace_sandbox/` (or configured directory). Path traversal attempts (`../`) are automatically rejected.

## Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Packages in `requirements.txt`:
  - `fastapi`
  - `uvicorn`
  - `pydantic`
  - `openpyxl`

## Installation & Running

```bash
cd automation
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```

## API Specification

### 1. Health Check
- **Endpoint**: `GET http://127.0.0.1:8000/health`
- **Response**:
```json
{
  "status": "healthy",
  "service": "forge-python-automation",
  "version": "1.0.0",
  "host": "127.0.0.1",
  "port": 8000,
  "registered_tools": ["excel_writer", "file_system"],
  "sandbox_directory": "C:\\Users\\...\\workspace_sandbox",
  "arbitrary_execution_policy": "STRICTLY_BLOCKED"
}
```

### 2. Execute Tool
- **Endpoint**: `POST http://127.0.0.1:8000/tools/execute`
- **Excel Example**:
```json
{
  "tool": "excel_writer",
  "taskId": "task-001",
  "params": {
    "action": "create_workbook",
    "filePath": "quarterly_sales.xlsx",
    "sheetName": "Q1-Q4 Revenue",
    "headers": ["Department", "Q1", "Q2", "Q3", "Q4", "Total"]
  }
}
```
- **File System Example**:
```json
{
  "tool": "file_system",
  "taskId": "task-002",
  "params": {
    "action": "list_directory",
    "targetDirectory": "."
  }
}
```
- **Response**:
```json
{
  "success": true,
  "tool": "excel_writer",
  "taskId": "task-001",
  "output": { ... },
  "artifacts": [
    {
      "name": "quarterly_sales.xlsx",
      "path": ".../quarterly_sales.xlsx",
      "type": "excel",
      "size": 24500
    }
  ]
}
```

