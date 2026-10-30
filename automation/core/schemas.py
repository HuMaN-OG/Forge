
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ToolExecutionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contractVersion: Literal["1.0"]
    taskId: str = Field(min_length=1)
    tool: str = Field(min_length=1)
    action: str = Field(min_length=1)
    params: dict = Field(default_factory=dict)
    workspaceId: str = "default"
    executionMode: Literal["approved"]
