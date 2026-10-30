import os
import secrets
from fastapi import Header

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from automation.storage.database import initialize_database
from automation.storage.task_history import save_task, get_all_tasks

from automation.core.schemas import ToolExecutionRequest
from automation.core.dispatcher import execute_tool


app = FastAPI(
    title="FORGE AI Automation Service",
    description="Local Python automation service",
    version="1.0.0"
)


@app.on_event("startup")
def startup():
    initialize_database()


class TaskRequest(BaseModel):
    instruction: str
    task_type: str
    status: str
    result: str | None = None


@app.get("/")
def home():
    return {
        "message": "Welcome to FORGE AI Automation Service",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "python-automation",
        "storage": "local"
    }


@app.post("/tasks")
def create_task(task: TaskRequest):
    task_id = save_task(
        task.instruction,
        task.task_type,
        task.status,
        task.result
    )

    return {
        "message": "Task saved successfully",
        "task_id": task_id
    }


@app.get("/tasks")
def read_tasks():
    return {
        "total": len(get_all_tasks()),
        "tasks": get_all_tasks()
    }



@app.post("/tools/execute")
def execute_tool_endpoint(
    request: ToolExecutionRequest,
    forge_token: str | None = Header(
        default=None,
        alias="X-FORGE-TOKEN"
    )
):
    # 1. Get the expected token from the environment
    expected_token = os.environ.get("FORGE_AUTOMATION_TOKEN")

    if not expected_token:
        raise HTTPException(
            status_code=503,
            detail="Automation authentication is not configured."
        )

    # 2. Verify the shared secret
    if (
        not forge_token
        or not secrets.compare_digest(forge_token, expected_token)
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing authentication token."
        )

    # 3. Allow only the currently enabled read-only tool
    if (
        request.tool != "file_system"
        or request.action != "list_directory"
    ):
        raise HTTPException(
            status_code=403,
            detail="This tool is not enabled."
        )

    # 4. Execute the registered tool
    return execute_tool(
        tool_name=request.tool,
        action=request.action,
        params=request.params,
        task_id=request.taskId
    )

