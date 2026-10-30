
from automation.core.tool_registry import get_tool


def execute_tool(
    tool_name: str,
    action: str,
    params: dict,
    task_id: str = "local-test"
):
    """
    Execute only tools available in the registered tool registry.
    """

    # 1. Validate parameters
    if not isinstance(params, dict):
        return {
            "success": False,
            "taskId": task_id,
            "tool": tool_name,
            "action": action,
            "status": "failed",
            "result": None,
            "artifacts": [],
            "verification": {
                "verified": False,
                "message": "Parameters must be a dictionary."
            },
            "error": {
                "code": "INVALID_PARAMS",
                "message": "Invalid parameters provided."
            }
        }

    # 2. Find registered tool
    tool_function = get_tool(tool_name, action)

    if tool_function is None:
        return {
            "success": False,
            "taskId": task_id,
            "tool": tool_name,
            "action": action,
            "status": "failed",
            "result": None,
            "artifacts": [],
            "verification": {
                "verified": False,
                "message": "Tool is not registered."
            },
            "error": {
                "code": "TOOL_NOT_FOUND",
                "message": f"Tool '{tool_name}.{action}' is not registered."
            }
        }

    # 3. Execute registered tool
    try:
        result = tool_function(**params)

        return {
            "success": True,
            "taskId": task_id,
            "tool": tool_name,
            "action": action,
            "status": "completed",
            "result": result,
            "artifacts": [],
            "verification": {
                "verified": True,
                "message": "Tool executed successfully and returned a result."
            },
            "error": None
        }

    except TypeError as error:
        return {
            "success": False,
            "taskId": task_id,
            "tool": tool_name,
            "action": action,
            "status": "failed",
            "result": None,
            "artifacts": [],
            "verification": {
                "verified": False,
                "message": "Tool parameters could not be validated."
            },
            "error": {
                "code": "INVALID_PARAMS",
                "message": str(error)
            }
        }

    except Exception as error:
        return {
            "success": False,
            "taskId": task_id,
            "tool": tool_name,
            "action": action,
            "status": "failed",
            "result": None,
            "artifacts": [],
            "verification": {
                "verified": False,
                "message": "Tool execution failed."
            },
            "error": {
                "code": "EXECUTION_ERROR",
                "message": str(error)
            }
        }
