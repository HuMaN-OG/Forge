
from automation.tools.file_system import list_directory


# Only explicitly registered tools can be executed.
TOOL_REGISTRY = {
    ("file_system", "list_directory"): list_directory,
}


def get_tool(tool_name: str, action: str):
    """
    Return a registered tool function.
    Return None if the tool/action is not registered.
    """
    return TOOL_REGISTRY.get((tool_name, action))


def list_registered_tools():
    """
    Return the names of all registered tools.
    """
    return [
        {
            "tool": tool_name,
            "action": action
        }
        for tool_name, action in TOOL_REGISTRY
    ]
