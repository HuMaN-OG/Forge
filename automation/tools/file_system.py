import os
from pathlib import Path


LOCAL_APP_DATA = Path(
    os.environ.get(
        "LOCALAPPDATA",
        Path.home() / "AppData" / "Local"
    )
)

WORKSPACE = LOCAL_APP_DATA / "ForgeAI" / "workspace_sandbox"

WORKSPACE.mkdir(parents=True, exist_ok=True)


def list_directory(target_directory="."):

    requested_path = Path(target_directory)

    if requested_path.is_absolute():
        raise ValueError("Absolute paths are not allowed")

    target_path = (WORKSPACE / requested_path).resolve()

    # Prevent access outside the permitted workspace
    try:
        target_path.relative_to(WORKSPACE.resolve())
    except ValueError:
        raise ValueError("Access outside workspace is not allowed")

    if not target_path.exists():
        raise FileNotFoundError("Directory does not exist")

    if not target_path.is_dir():
        raise NotADirectoryError("Requested path is not a directory")

    entries = []

    for item in target_path.iterdir():

        entries.append({
            "name": item.name,
            "type": "directory" if item.is_dir() else "file"
        })

    return {
        "directory": str(target_path),
        "total": len(entries),
        "entries": entries
    }