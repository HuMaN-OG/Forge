from fastapi import FastAPI, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import uvicorn
import re
import os
from pathlib import Path

from src.config import HOST, PORT, WORKSPACE_DIR, AUTH_TOKEN
from src.tools.excel_tool import execute_excel_tool
from src.tools.file_tool import execute_file_tool
from src.tools.desktop_tool import execute_desktop_tool

app = FastAPI(
    title="FORGE AI - Python Automation Service",
    description="Local tool automation runtime for sandboxed file and Excel operations.",
    version="1.0.0"
)

# CORS restricted strictly to intended local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# STRICT SECURITY POLICY: Forbidden arbitrary command execution patterns
FORBIDDEN_KEYWORDS = [
    r"\bterminal\b",
    r"\bshell\b",
    r"\bbash\b",
    r"\bcmd\b",
    r"\bpowershell\b",
    r"\bexec\b",
    r"\beval\b",
    r"\bspawn\b",
    r"\bsubprocess\b",
    r"\bos\.system\b",
    r"\brm\s+-rf\b"
]

def check_security_violation(tool: str, action: Optional[str], params: Dict[str, Any]) -> bool:
    for pattern in FORBIDDEN_KEYWORDS:
        if re.search(pattern, tool or "", re.IGNORECASE):
            return True
        if action and re.search(pattern, action, re.IGNORECASE):
            return True

    # Scan parameter metadata while treating document body text as data
    safe_params = {
        k: v for k, v in params.items()
        if k not in ("text", "content", "rows", "headers")
    }
    params_str = str(safe_params)
    for pattern in FORBIDDEN_KEYWORDS:
        if re.search(pattern, params_str, re.IGNORECASE):
            return True
    return False


class ToolExecutionRequest(BaseModel):
    contractVersion: str = Field(default="1.0", description="API contract version")
    taskId: str = Field(..., description="Task ID assigned by backend orchestrator")
    tool: str = Field(..., description="Registered tool name: 'excel_writer', 'file_system', or 'desktop_control'")
    action: Optional[str] = Field(default=None, description="Tool action name (e.g. list_directory)")
    params: Dict[str, Any] = Field(default_factory=dict, description="Tool-specific structured parameters")
    workspaceId: str = Field(default="default", description="Workspace ID")
    executionMode: str = Field(default="approved", description="Execution mode: approved")


class Artifact(BaseModel):
    name: str
    path: str
    type: str
    size: Optional[int] = 0


class ToolExecutionResponse(BaseModel):
    success: bool
    contractVersion: str = "1.0"
    tool: str
    action: Optional[str] = None
    taskId: str
    output: Optional[Dict[str, Any]] = None
    artifacts: Optional[List[Artifact]] = None
    error: Optional[str] = None


@app.get("/health")
def health_check():
    """Initial health check endpoint required by FORGE AI system."""
    return {
        "status": "healthy",
        "service": "forge-python-automation",
        "version": "1.0.0",
        "host": HOST,
        "port": PORT,
        "registered_tools": ["excel_writer", "file_system", "desktop_control"],
        "registered_actions": {
            "desktop_control": [
                "list_windows",
                "get_active_window",
                "launch_application",
                "type_text",
                "press_key",
                "save_document",
                "verify_document",
                "notepad_report"
            ]
        },
        "sandbox_directory": str(WORKSPACE_DIR),
        "arbitrary_execution_policy": "STRICTLY_BLOCKED"
    }


@app.post("/tools/execute", response_model=ToolExecutionResponse)
def execute_tool(
    request: ToolExecutionRequest,
    x_forge_token: Optional[str] = Header(None, alias="X-FORGE-TOKEN")
):
    """
    Executes a registered tool under safe sandbox boundaries with token authentication.
    Arbitrary terminal commands are strictly rejected.
    """
    # 0. Enforce authentication token verification
    if not x_forge_token or x_forge_token != AUTH_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Missing or invalid X-FORGE-TOKEN header."
        )

    # 1. Enforce security gate: Reject any arbitrary command execution
    if check_security_violation(request.tool, request.action, request.params):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Policy Violation: Arbitrary terminal/shell command execution is strictly forbidden."
        )

    # Propagate action into params if given
    if request.action and "action" not in request.params:
        request.params["action"] = request.action

    action_name = request.action or request.params.get("action")

    # 2. Dispatch to registered tools
    if request.tool == "excel_writer":
        result = execute_excel_tool(request.params, WORKSPACE_DIR)
    elif request.tool == "file_system":
        result = execute_file_tool(request.params, WORKSPACE_DIR)
    elif request.tool == "desktop_control":
        result = execute_desktop_tool(request.params, WORKSPACE_DIR)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unregistered tool: '{request.tool}'. Registered tools are: ['excel_writer', 'file_system', 'desktop_control']"
        )

    if not result.get("success"):
        return ToolExecutionResponse(
            success=False,
            contractVersion=request.contractVersion,
            tool=request.tool,
            action=action_name,
            taskId=request.taskId,
            output=result,
            artifacts=[],
            error=result.get("error", "Tool execution failed")
        )

    artifacts = result.get("artifacts", [])
    formatted_artifacts = [
        Artifact(
            name=a.get("name", "artifact"),
            path=a.get("path", ""),
            type=a.get("type", "file"),
            size=a.get("size", 0)
        )
        for a in artifacts
    ]

    return ToolExecutionResponse(
        success=True,
        contractVersion=request.contractVersion,
        tool=request.tool,
        action=action_name,
        taskId=request.taskId,
        output=result,
        artifacts=formatted_artifacts
    )


if __name__ == "__main__":
    uvicorn.run("src.main:app", host=HOST, port=PORT, reload=False)
