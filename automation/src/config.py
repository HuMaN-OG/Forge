import os
from pathlib import Path

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
AUTH_TOKEN = os.getenv("FORGE_AUTOMATION_TOKEN", "forge_secret_token_2026")

# Canonical Forge root workspace_sandbox
forge_root_workspace = Path(__file__).resolve().parent.parent.parent / "workspace_sandbox"
WORKSPACE_DIR = Path(os.getenv("WORKSPACE_DIR", str(forge_root_workspace))).resolve()

# Ensure workspace sandbox exists
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
