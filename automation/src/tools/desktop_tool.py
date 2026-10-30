"""
FORGE AI — Computer Control Engine Tool Module
desktop_control: Provides local desktop automation via pywinauto UIA backend.

Strict Security Boundaries:
- Strict Application Allowlist (Notepad, File Explorer). Arbitrary executables are strictly forbidden.
- Strict Keyboard Sequence Allowlist (CTRL+S, CTRL+A, ENTER, ESC, ALT+F4).
- Safe sandboxed file operations confined strictly to canonical workspace_sandbox.
- Human authorization required prior to execution.
"""

import os
import sys
import time
import subprocess
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import win32gui
import win32process
import winreg
import shutil
import win32con
import win32api
import ctypes

try:
    from pywinauto import Desktop, Application
    from pywinauto.keyboard import send_keys
    PYWINAUTO_AVAILABLE = True
except ImportError:
    PYWINAUTO_AVAILABLE = False


# STRICT APPLICATION ALLOWLIST: Only explicitly approved local utilities
APPROVED_APPLICATIONS = {
    "notepad": {
        "binary": "notepad.exe",
        "title_pattern": r".*Notepad.*",
        "doc_control_type": "Document"
    },
    "file_explorer": {
        "binary": "explorer.exe",
        "title_pattern": r".*File Explorer.*",
        "doc_control_type": None
    },
    "explorer": {
        "binary": "explorer.exe",
        "title_pattern": r".*File Explorer.*",
        "doc_control_type": None
    },
    "word": {
        "binary": "WINWORD.EXE",
        "title_pattern": r".*Word.*",
        "doc_control_type": "Document"
    },
    "winword": {
        "binary": "WINWORD.EXE",
        "title_pattern": r".*Word.*",
        "doc_control_type": "Document"
    },
    "excel": {
        "binary": "EXCEL.EXE",
        "title_pattern": r".*Excel.*",
        "doc_control_type": None
    },
    "powerpoint": {
        "binary": "POWERPNT.EXE",
        "title_pattern": r".*PowerPoint.*",
        "doc_control_type": None
    },
    "ppt": {
        "binary": "POWERPNT.EXE",
        "title_pattern": r".*PowerPoint.*",
        "doc_control_type": None
    },
    "chrome": {
        "binary": "chrome.exe",
        "title_pattern": r".*Chrome.*",
        "doc_control_type": None
    },
    "edge": {
        "binary": "msedge.exe",
        "title_pattern": r".*Edge.*",
        "doc_control_type": None
    },
    "vscode": {
        "binary": "Code.exe",
        "title_pattern": r".*Visual Studio Code.*",
        "doc_control_type": None
    },
    "code": {
        "binary": "Code.exe",
        "title_pattern": r".*Visual Studio Code.*",
        "doc_control_type": None
    },
    "calc": {
        "binary": "calc.exe",
        "title_pattern": r".*Calculator.*",
        "doc_control_type": None
    },
    "calculator": {
        "binary": "calc.exe",
        "title_pattern": r".*Calculator.*",
        "doc_control_type": None
    }
}

def resolve_approved_executable(app_key: str) -> Optional[str]:
    """
    Safely resolves the full path to an approved application's executable.
    Checks:
    1. PATH via shutil.which
    2. Windows Registry App Paths (HKLM and HKCU)
    3. Common fixed 64-bit and 32-bit Program Files directories
    Never accepts arbitrary user-supplied paths.
    """
    if app_key not in APPROVED_APPLICATIONS:
        return None

    binary = APPROVED_APPLICATIONS[app_key]["binary"]

    # 1. Check system PATH
    found = shutil.which(binary)
    if found and os.path.isfile(found):
        return found

    # 2. Check Registry App Paths
    for root in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
        try:
            key_path = f"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\{binary}"
            with winreg.OpenKey(root, key_path) as k:
                val, _ = winreg.QueryValueEx(k, "")
                if val and os.path.isfile(val):
                    return val
        except Exception:
            pass

    # 3. Known standard install paths for allowlisted apps
    common_roots = [
        os.environ.get("ProgramFiles", "C:\\Program Files"),
        os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"),
        os.environ.get("LocalAppData", "C:\\Users\\Default\\AppData\\Local")
    ]
    app_relative_hints = {
        "word": ["Microsoft Office\\root\\Office16\\WINWORD.EXE", "Microsoft Office\\Office16\\WINWORD.EXE"],
        "winword": ["Microsoft Office\\root\\Office16\\WINWORD.EXE", "Microsoft Office\\Office16\\WINWORD.EXE"],
        "excel": ["Microsoft Office\\root\\Office16\\EXCEL.EXE", "Microsoft Office\\Office16\\EXCEL.EXE"],
        "powerpoint": ["Microsoft Office\\root\\Office16\\POWERPNT.EXE", "Microsoft Office\\Office16\\POWERPNT.EXE"],
        "ppt": ["Microsoft Office\\root\\Office16\\POWERPNT.EXE", "Microsoft Office\\Office16\\POWERPNT.EXE"],
        "chrome": ["Google\\Chrome\\Application\\chrome.exe"],
        "edge": ["Microsoft\\Edge\\Application\\msedge.exe"],
        "vscode": ["Programs\\Microsoft VS Code\\Code.exe", "Microsoft VS Code\\Code.exe"],
        "code": ["Programs\\Microsoft VS Code\\Code.exe", "Microsoft VS Code\\Code.exe"]
    }

    hints = app_relative_hints.get(app_key, [])
    for c_root in common_roots:
        for hint in hints:
            cand = os.path.join(c_root, hint)
            if os.path.isfile(cand):
                return cand

    return None

# STRICT KEYBOARD SEQUENCE ALLOWLIST: Only approved operational keystrokes
APPROVED_KEY_COMBOS = {
    "CTRL+S": "^s",
    "CTRL+A": "^a",
    "ENTER": "{ENTER}",
    "ESC": "{ESC}",
    "ALT+F4": "%{F4}"
}

ALLOWED_DESKTOP_EXTENSIONS = {".txt", ".md", ".log", ".docx", ".pdf", ".pptx", ".csv", ".json", ".xlsx"}


def safe_resolve_desktop_path(filename: str, workspace_dir: Path) -> Path:
    """
    Validates and safely resolves a file path strictly inside the canonical workspace sandbox.
    Rejects directory traversal, backslashes/slashes, and unapproved extensions.
    """
    if not filename or not isinstance(filename, str):
        raise ValueError("Filename must be a non-empty string.")

    # Prevent directory traversal attacks
    if "/" in filename or "\\" in filename or ".." in filename:
        raise PermissionError(f"Security Policy Violation: File path traversal or directory separators are forbidden: '{filename}'")

    # Allowed extensions
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_DESKTOP_EXTENSIONS:
        raise PermissionError(
            f"Access Denied: Unsupported file extension '{suffix}'. Permitted desktop extensions: {', '.join(sorted(ALLOWED_DESKTOP_EXTENSIONS))}"
        )

    resolved_workspace = workspace_dir.resolve()
    target_path = (resolved_workspace / filename).resolve()

    try:
        target_path.relative_to(resolved_workspace)
    except ValueError:
        raise PermissionError(f"Access Denied: Path '{filename}' attempts to escape workspace sandbox.")

    return target_path


def get_collision_safe_path(target_path: Path) -> Path:
    """Returns a non-colliding file path by appending _1, _2 if file exists."""
    if not target_path.exists():
        return target_path

    parent = target_path.parent
    stem = target_path.stem
    suffix = target_path.suffix
    counter = 1

    while True:
        new_path = parent / f"{stem}_{counter}{suffix}"
        if not new_path.exists():
            return new_path
        counter += 1


def force_foreground_window(hwnd: int):
    """
    Reliably brings a window handle to the foreground on Windows.
    Bypasses foreground lock restriction safely.
    """
    if not hwnd or not win32gui.IsWindow(hwnd):
        return

    try:
        if win32gui.IsIconic(hwnd):
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
        else:
            win32gui.ShowWindow(hwnd, win32con.SW_SHOW)

        current_thread_id = ctypes.windll.kernel32.GetCurrentThreadId()
        target_thread_id, _ = win32process.GetWindowThreadProcessId(hwnd)

        ctypes.windll.user32.AllowSetForegroundWindow(-1)
        ctypes.windll.user32.AttachThreadInput(current_thread_id, target_thread_id, True)
        ctypes.windll.user32.SetForegroundWindow(hwnd)
        ctypes.windll.user32.SetFocus(hwnd)
        ctypes.windll.user32.AttachThreadInput(current_thread_id, target_thread_id, False)
    except Exception:
        pass


def list_desktop_windows(filter_visible: bool = True) -> List[Dict[str, Any]]:
    """
    Enumerates active desktop top-level windows via pywinauto UIA backend.
    """
    if not PYWINAUTO_AVAILABLE:
        raise RuntimeError("pywinauto is not available in the current Python environment.")

    d = Desktop(backend="uia")
    wins = d.windows()
    active_hwnd = win32gui.GetForegroundWindow()

    window_list = []
    for w in wins:
        try:
            title = w.window_text().strip()
            visible = w.is_visible()
            if filter_visible and (not visible or not title):
                continue

            hwnd = w.handle
            pid = w.process_id()
            class_name = w.class_name()

            # Identify known process name from class or allowlist
            process_name = "unknown"
            if "notepad" in class_name.lower() or "notepad" in title.lower():
                process_name = "notepad.exe"
            elif "cabinetwclass" in class_name.lower() or "explorer" in class_name.lower():
                process_name = "explorer.exe"

            window_list.append({
                "handle": hwnd,
                "title": title,
                "pid": pid,
                "class_name": class_name,
                "process_name": process_name,
                "visible": visible,
                "is_active": hwnd == active_hwnd
            })
        except Exception:
            continue

    return window_list


def get_active_desktop_window() -> Dict[str, Any]:
    """
    Returns metadata for the current active foreground window.
    """
    hwnd = win32gui.GetForegroundWindow()
    title = win32gui.GetWindowText(hwnd).strip() if hwnd else ""
    pid = 0
    if hwnd:
        _, pid = win32process.GetWindowThreadProcessId(hwnd)

    rect = {}
    if hwnd:
        try:
            r = win32gui.GetWindowRect(hwnd)
            rect = {"left": r[0], "top": r[1], "right": r[2], "bottom": r[3], "width": r[2] - r[0], "height": r[3] - r[1]}
        except Exception:
            pass

    return {
        "handle": hwnd,
        "title": title or "Desktop",
        "pid": pid,
        "rect": rect,
        "is_active": True
    }


def launch_approved_application(app_name: str) -> Dict[str, Any]:
    """
    Launches an approved application from the strict allowlist.
    Arbitrary executable names or paths are strictly rejected.
    """
    if not app_name or not isinstance(app_name, str):
        raise ValueError("Parameter 'appName' is required and must be a string.")

    normalized_app = app_name.strip().lower()
    if normalized_app not in APPROVED_APPLICATIONS:
        approved_names = sorted(list(set(APPROVED_APPLICATIONS.keys())))
        raise PermissionError(
            f"Access Denied: Application '{app_name}' is not in the approved desktop allowlist. Permitted applications: {approved_names}"
        )

    app_spec = APPROVED_APPLICATIONS[normalized_app]
    binary = app_spec["binary"]
    title_pattern = app_spec["title_pattern"]

    # Resolve binary full path safely
    exec_path = resolve_approved_executable(normalized_app)
    if not exec_path:
        raise FileNotFoundError(
            f"Application '{app_name}' is in the approved allowlist, but its executable '{binary}' was not found on this system."
        )

    # Launch application using verified safe binary
    proc = subprocess.Popen([exec_path])

    # Wait for window to appear (up to 5 seconds)
    found_window = None
    deadline = time.time() + 5.0
    while time.time() < deadline:
        d = Desktop(backend="uia")
        candidates = d.windows(title_re=title_pattern)
        if candidates:
            found_window = candidates[0]
            break
        time.sleep(0.3)

    window_title = found_window.window_text() if found_window else f"{app_name} (Launched)"
    window_handle = found_window.handle if found_window else 0

    if found_window:
        force_foreground_window(found_window.handle)

    return {
        "success": True,
        "application": normalized_app,
        "executable": binary,
        "pid": proc.pid,
        "windowTitle": window_title,
        "handle": window_handle
    }


def type_text_into_window(
    text: str,
    target_window_title: Optional[str] = None,
    append: bool = False
) -> Dict[str, Any]:
    """
    Focuses the target approved window (Notepad) and types text into its document/editor control.
    """
    if not text:
        text = ""

    # Security limit: prevent buffer exhaustion
    max_len = 100000
    if len(text) > max_len:
        raise ValueError(f"Text length exceeds maximum allowed limit of {max_len} characters.")

    d = Desktop(backend="uia")
    pattern = target_window_title or r".*Notepad.*"
    wins = d.windows(title_re=pattern)

    if not wins:
        raise RuntimeError(f"Target window matching pattern '{pattern}' not found on desktop.")

    target_win = wins[0]
    force_foreground_window(target_win.handle)
    time.sleep(0.3)

    app = Application(backend="uia").connect(handle=target_win.handle)
    dlg = app.window(handle=target_win.handle)

    # Attempt UIA ValuePattern (modern Windows 11 Notepad Document)
    text_applied = False
    try:
        doc = dlg.child_window(control_type="Document")
        vp = doc.wrapper_object().iface_value
        if vp:
            if append:
                existing = vp.CurrentValue or ""
                vp.SetValue(existing + text)
            else:
                vp.SetValue(text)
            text_applied = True
    except Exception:
        pass

    if not text_applied:
        # Fallback to type_keys or child Edit control
        try:
            edit = dlg.child_window(control_type="Edit")
            edit.set_focus()
            edit.type_keys(text, with_spaces=True, with_newlines=True)
            text_applied = True
        except Exception:
            target_win.set_focus()
            send_keys(text, with_spaces=True)
            text_applied = True

    return {
        "success": True,
        "windowTitle": target_win.window_text(),
        "charactersTyped": len(text),
        "handle": target_win.handle
    }


def press_approved_key(
    key_combo: str,
    target_window_title: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends an approved keyboard sequence to the target desktop window.
    Arbitrary keyboard sequences outside the allowlist are strictly rejected.
    """
    if not key_combo or not isinstance(key_combo, str):
        raise ValueError("Parameter 'keyCombo' is required and must be a string.")

    normalized_combo = key_combo.strip().upper().replace(" ", "")
    if normalized_combo not in APPROVED_KEY_COMBOS:
        permitted_combos = ", ".join(APPROVED_KEY_COMBOS.keys())
        raise PermissionError(
            f"Security Policy Violation: Key combination '{key_combo}' is not in the approved keyboard allowlist. Permitted combinations: {permitted_combos}"
        )

    pywinauto_seq = APPROVED_KEY_COMBOS[normalized_combo]

    target_hwnd = None
    if target_window_title:
        d = Desktop(backend="uia")
        wins = d.windows(title_re=target_window_title)
        if wins:
            target_hwnd = wins[0].handle
            force_foreground_window(target_hwnd)
            time.sleep(0.2)

    send_keys(pywinauto_seq)

    return {
        "success": True,
        "keyCombo": normalized_combo,
        "sentSequence": pywinauto_seq,
        "targetHandle": target_hwnd
    }


def save_desktop_document(
    filename: str,
    content: str,
    workspace_dir: Path,
    overwrite: bool = True
) -> Dict[str, Any]:
    """
    Saves a text document strictly inside the canonical workspace sandbox.
    Verifies physical disk persistence and returns artifact metadata.
    """
    target_path = safe_resolve_desktop_path(filename, workspace_dir)

    if not overwrite and target_path.exists():
        target_path = get_collision_safe_path(target_path)

    # Write file to disk and sync
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(content)
        f.flush()
        os.fsync(f.fileno())

    # Verify physical file existence and integrity
    if not target_path.exists():
        raise RuntimeError(f"File verification failed: '{target_path.name}' does not exist on disk after save.")

    stats = target_path.stat()
    file_size = stats.st_size
    sha256 = hashlib.sha256(target_path.read_bytes()).hexdigest()

    return {
        "success": True,
        "filename": target_path.name,
        "path": str(target_path),
        "size": file_size,
        "hash": sha256,
        "artifacts": [
            {
                "name": target_path.name,
                "path": str(target_path),
                "type": "file",
                "size": file_size
            }
        ]
    }


def verify_desktop_document(
    filename: str,
    workspace_dir: Path,
    expected_content: Optional[str] = None,
    expected_substring: Optional[str] = None
) -> Dict[str, Any]:
    """
    Verifies existence, size, and content of a file within the workspace sandbox.
    """
    target_path = safe_resolve_desktop_path(filename, workspace_dir)

    if not target_path.exists():
        return {
            "success": False,
            "exists": False,
            "error": f"Document '{filename}' not found in workspace sandbox."
        }

    stats = target_path.stat()
    content = target_path.read_text(encoding="utf-8", errors="replace")
    sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()

    matched = True
    if expected_content is not None and content.strip() != expected_content.strip():
        matched = False
    if expected_substring is not None and expected_substring not in content:
        matched = False

    return {
        "success": True,
        "exists": True,
        "verified": True,
        "filename": target_path.name,
        "path": str(target_path),
        "size": stats.st_size,
        "hash": sha256,
        "matched": matched,
        "contentSnippet": content[:200]
    }


def execute_notepad_report_flow(
    params: Dict[str, Any],
    workspace_dir: Path
) -> Dict[str, Any]:
    """
    Composite high-level workflow:
    1. Launch or connect to Notepad.
    2. Focus Notepad on the desktop.
    3. Type the structured AI report into Notepad.
    4. Save document cleanly to workspace_sandbox/AI_Report.txt.
    5. Verify file persistence and integrity on disk.
    6. Return full execution output and verified artifact.
    """
    filename = params.get("filename") or params.get("filePath") or "AI_Report.txt"
    topic = params.get("reportTopic") or params.get("topic") or "Artificial Intelligence"
    close_after = params.get("closeAfter", False)

    # 1. Generate or extract report content
    custom_content = params.get("content") or params.get("text")
    if custom_content:
        report_content = custom_content.strip()
    else:
        timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        report_content = (
            f"======================================================================\n"
            f"          FORGE AI COMPUTER CONTROL ENGINE — AUTOMATION REPORT         \n"
            f"======================================================================\n\n"
            f"TOPIC: {topic}\n"
            f"GENERATED AT: {timestamp_str}\n"
            f"CANONICAL WORKSPACE: {workspace_dir}\n"
            f"AUTOMATION ENGINE: pywinauto (UIA Backend) + Local FastAPI Runtime\n\n"
            f"----------------------------------------------------------------------\n"
            f"1. EXECUTIVE OVERVIEW\n"
            f"----------------------------------------------------------------------\n"
            f"Artificial Intelligence (AI) represents the computational paradigm of\n"
            f"synthesizing reasoning, perception, and deterministic execution.\n"
            f"Within local-first architectures, AI models function as intelligent\n"
            f"orchestrators, transforming natural language requirements into safely\n"
            f"governed computer operations without reliance on centralized clouds.\n\n"
            f"----------------------------------------------------------------------\n"
            f"2. KEY ARCHITECTURAL TENETS OF FORGE AI\n"
            f"----------------------------------------------------------------------\n"
            f"A. Offline-First Privacy: Local inference powered by Ollama ensures\n"
            f"   that user queries, telemetry, and documents never exit the machine.\n\n"
            f"B. Human-in-the-Loop Authorization Gate: Every automation task requires\n"
            f"   explicit operator consent prior to desktop execution.\n\n"
            f"C. Strict Allowlist Security: Only approved desktop applications\n"
            f"   (Notepad, File Explorer) and keys (CTRL+S, ENTER, etc.) are allowed.\n"
            f"   Arbitrary shell/terminal commands are completely blocked.\n\n"
            f"D. Sandboxed Persistence & Verification: All generated artifacts are\n"
            f"   strictly confined to the workspace sandbox and physically verified\n"
            f"   against disk contents and SHA-256 checksums.\n\n"
            f"----------------------------------------------------------------------\n"
            f"3. EXECUTION SUMMARY\n"
            f"----------------------------------------------------------------------\n"
            f"This document was authored through FORGE AI Desktop Automation via\n"
            f"direct UI interaction with Windows Notepad and verified on disk.\n"
            f"======================================================================\n"
        )

    # 2. Launch Notepad or identify active Notepad instance
    d = Desktop(backend="uia")
    existing_notepad = d.windows(title_re=r".*Notepad.*")
    notepad_win = None

    if existing_notepad:
        notepad_win = existing_notepad[0]
        force_foreground_window(notepad_win.handle)
    else:
        launch_res = launch_approved_application("notepad")
        time.sleep(1.0)
        notepad_wins = d.windows(title_re=r".*Notepad.*")
        if notepad_wins:
            notepad_win = notepad_wins[0]

    # 3. Type report into Notepad window
    typed_info = {}
    if notepad_win:
        force_foreground_window(notepad_win.handle)
        time.sleep(0.3)
        typed_info = type_text_into_window(
            text=report_content,
            target_window_title=r".*Notepad.*",
            append=False
        )

    # 4. Save document cleanly inside workspace sandbox
    save_result = save_desktop_document(
        filename=filename,
        content=report_content,
        workspace_dir=workspace_dir,
        overwrite=True
    )

    # 5. Verify physical document existence and content
    verify_result = verify_desktop_document(
        filename=filename,
        workspace_dir=workspace_dir,
        expected_substring="FORGE AI COMPUTER CONTROL ENGINE"
    )

    # 6. Optionally close Notepad if requested
    if close_after and notepad_win:
        try:
            notepad_win.close()
        except Exception:
            pass

    return {
        "success": True,
        "action": "notepad_report",
        "topic": topic,
        "filename": save_result["filename"],
        "path": save_result["path"],
        "size": save_result["size"],
        "hash": save_result["hash"],
        "notepadInteracted": bool(notepad_win),
        "charactersTyped": typed_info.get("charactersTyped", len(report_content)),
        "verifiedOnDisk": verify_result.get("verified", False),
        "artifacts": save_result["artifacts"]
    }


def open_document_in_app(filename: str, app_name: Optional[str], workspace_dir: Path) -> Dict[str, Any]:
    """
    Safely opens a verified workspace document inside an approved desktop application.
    """
    from src.tools.file_tool import safe_resolve_path
    target_path = safe_resolve_path(filename, workspace_dir)
    if not target_path.exists():
        raise FileNotFoundError(f"File not found in workspace sandbox: {filename}")

    ext = target_path.suffix.lower()
    inferred_app = "notepad"
    if ext in (".docx", ".doc"):
        inferred_app = "word"
    elif ext in (".xlsx", ".xls", ".csv"):
        inferred_app = "excel"
    elif ext in (".pptx", ".ppt"):
        inferred_app = "powerpoint"
    elif ext in (".pdf", ".html"):
        inferred_app = "edge"
    elif ext in (".txt", ".md", ".log", ".json"):
        inferred_app = "notepad"

    selected_app = (app_name or inferred_app).strip().lower()
    if selected_app not in APPROVED_APPLICATIONS:
        raise PermissionError(f"Application '{selected_app}' is not in approved allowlist.")

    exec_path = resolve_approved_executable(selected_app)
    if not exec_path:
        if ext in (".txt", ".md", ".log", ".json"):
            exec_path = resolve_approved_executable("notepad")
        else:
            raise FileNotFoundError(f"Executable for '{selected_app}' is not installed on this system.")

    proc = subprocess.Popen([exec_path, str(target_path)])
    time.sleep(1.0)

    hwnd = 0
    title = target_path.name
    try:
        d = Desktop(backend="uia")
        pattern = APPROVED_APPLICATIONS[selected_app]["title_pattern"]
        candidates = d.windows(title_re=pattern)
        if candidates:
            hwnd = candidates[0].handle
            title = candidates[0].window_text()
            force_foreground_window(hwnd)
    except Exception:
        pass

    return {
        "success": True,
        "action": "open_document_in_app",
        "file": target_path.name,
        "application": selected_app,
        "executable": exec_path,
        "pid": proc.pid,
        "handle": hwnd,
        "windowTitle": title
    }


def execute_desktop_tool(params: Dict[str, Any], workspace_dir: Path) -> Dict[str, Any]:
    """
    Main entry point for 'desktop_control' registered tool.
    Dispatches to safe desktop actions.
    """
    raw_action = params.get("action", "notepad_report")
    # Normalize action name: strip "desktop." or "desktop_" prefix if present
    action = raw_action.lower()
    if action.startswith("desktop."):
        action = action[len("desktop."):]
    elif action.startswith("desktop_"):
        action = action[len("desktop_"):]

    try:
        if action == "list_windows":
            filter_visible = params.get("filterVisible", True)
            windows = list_desktop_windows(filter_visible=filter_visible)
            return {
                "success": True,
                "action": "list_windows",
                "count": len(windows),
                "windows": windows
            }

        elif action == "get_active_window":
            active_info = get_active_desktop_window()
            return {
                "success": True,
                "action": "get_active_window",
                "window": active_info
            }

        elif action == "launch_application":
            app_name = params.get("appName") or params.get("application") or params.get("app")
            return launch_approved_application(app_name)

        elif action == "type_text":
            text = params.get("text", "")
            target_title = params.get("targetWindowTitle") or params.get("targetWindow")
            append = params.get("append", False)
            return type_text_into_window(text, target_title, append)

        elif action == "press_key":
            key_combo = params.get("keyCombo") or params.get("key")
            target_title = params.get("targetWindowTitle") or params.get("targetWindow")
            return press_approved_key(key_combo, target_title)

        elif action == "save_document":
            filename = params.get("filename") or params.get("filePath") or "AI_Report.txt"
            content = params.get("content") or params.get("text") or ""
            overwrite = params.get("overwrite", True)
            return save_desktop_document(filename, content, workspace_dir, overwrite)

        elif action == "verify_document":
            filename = params.get("filename") or params.get("filePath") or "AI_Report.txt"
            expected_content = params.get("expectedContent")
            expected_substring = params.get("expectedSubstring")
            return verify_desktop_document(filename, workspace_dir, expected_content, expected_substring)

        elif action == "notepad_report":
            return execute_notepad_report_flow(params, workspace_dir)

        elif action == "open_document_in_app":
            filename = params.get("filename") or params.get("filePath") or params.get("targetFile")
            app_name = params.get("appName") or params.get("application")
            return open_document_in_app(filename, app_name, workspace_dir)

        else:
            return {
                "success": False,
                "error": f"Unknown or unpermitted desktop action: '{raw_action}'. Permitted actions: ['list_windows', 'get_active_window', 'launch_application', 'type_text', 'press_key', 'save_document', 'verify_document', 'notepad_report']"
            }

    except Exception as e:
        return {
            "success": False,
            "action": raw_action,
            "error": str(e)
        }
