import os
from pathlib import Path

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
AUTH_TOKEN = os.getenv("FORGE_AUTOMATION_TOKEN", "").strip()
if len(AUTH_TOKEN) < 24:
    raise RuntimeError("FORGE_AUTOMATION_TOKEN must be set to a strong, shared local token. Use start-forge.ps1.")

# Canonical Forge root workspace_sandbox
forge_root_workspace = Path(__file__).resolve().parent.parent.parent / "workspace_sandbox"
WORKSPACE_DIR = Path(os.getenv("WORKSPACE_DIR", str(forge_root_workspace))).resolve()

# Ensure workspace sandbox exists
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
