import pytest
from fastapi.testclient import TestClient
import sys
import os
from pathlib import Path

# Add automation directory to sys.path
automation_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(automation_dir))
sys.path.insert(0, str(automation_dir / "src"))

from src.main import app, check_security_violation
from src.config import AUTH_TOKEN, WORKSPACE_DIR

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "sandbox_directory" in data
    assert data["arbitrary_execution_policy"] == "STRICTLY_BLOCKED"

def test_auth_protection():
    payload = {
        "taskId": "task-test-01",
        "tool": "file_system",
        "action": "list_directory",
        "params": {}
    }
    # 1. Unauthenticated request must be rejected with 401
    res_no_auth = client.post("/tools/execute", json=payload)
    assert res_no_auth.status_code == 401
    assert "Missing or invalid X-FORGE-TOKEN" in res_no_auth.json()["detail"]

    # 2. Invalid token must be rejected with 401
    res_bad_auth = client.post(
        "/tools/execute",
        headers={"X-FORGE-TOKEN": "invalid_secret_token_123"},
        json=payload
    )
    assert res_bad_auth.status_code == 401

def test_security_violation_filter():
    # Prohibited arbitrary shell/terminal execution patterns must be blocked
    assert check_security_violation("terminal", "execute", {})
    assert check_security_violation("file_system", "powershell", {})
    assert check_security_violation("file_system", "cmd", {})
    assert check_security_violation("file_system", "bash", {})
    assert check_security_violation("tool", "eval", {})

    # Permitted tools must pass check
    assert not check_security_violation("file_system", "write_file", {"path": "test.txt", "content": "hello"})
    assert not check_security_violation("excel_writer", "create_sheet", {"filename": "data.xlsx"})

def test_forbidden_execution_rejected_by_api():
    headers = {"X-FORGE-TOKEN": AUTH_TOKEN}
    response = client.post(
        "/tools/execute",
        headers=headers,
        json={
            "taskId": "task-security-01",
            "tool": "terminal",
            "action": "execute",
            "params": {"command": "whoami"}
        }
    )
    assert response.status_code == 403
    assert "Security Policy Violation" in response.json()["detail"]

def test_file_tool_sandboxed_operations():
    headers = {"X-FORGE-TOKEN": AUTH_TOKEN}

    # 1. Write file inside sandbox
    write_res = client.post(
        "/tools/execute",
        headers=headers,
        json={
            "taskId": "task-file-01",
            "tool": "file_system",
            "action": "write_file",
            "params": {"path": "unit_test_demo.txt", "content": "FORGE AI Sandboxed Automation Test"}
        }
    )
    assert write_res.status_code == 200
    write_data = write_res.json()
    assert write_data["success"]

    # 2. Read file
    read_res = client.post(
        "/tools/execute",
        headers=headers,
        json={
            "taskId": "task-file-02",
            "tool": "file_system",
            "action": "read_file",
            "params": {"path": "unit_test_demo.txt"}
        }
    )
    assert read_res.status_code == 200
    read_data = read_res.json()
    assert read_data["success"]
    assert "FORGE AI Sandboxed Automation Test" in str(read_data["output"])

    # 3. Path traversal outside sandbox must be blocked or safely trapped
    traversal_res = client.post(
        "/tools/execute",
        headers=headers,
        json={
            "taskId": "task-file-03",
            "tool": "file_system",
            "action": "read_file",
            "params": {"path": "../../windows/system.ini"}
        }
    )
    assert traversal_res.status_code in (400, 403, 500) or not traversal_res.json().get("success", False)

def test_excel_tool_operations():
    headers = {"X-FORGE-TOKEN": AUTH_TOKEN}
    
    # Create spreadsheet with data
    res = client.post(
        "/tools/execute",
        headers=headers,
        json={
            "taskId": "task-excel-01",
            "tool": "excel_writer",
            "action": "create_sheet",
            "params": {
                "filename": "unit_test_expenses.xlsx",
                "sheet_name": "Summary",
                "headers": ["Item", "Cost"],
                "rows": [["Cloud Server", 250], ["Domain", 15]]
            }
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"]
