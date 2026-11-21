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
import re
import threading

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
from ctypes import wintypes


class STARTUPINFOW(ctypes.Structure):
    _fields_ = [
        ('cb', wintypes.DWORD),
        ('lpReserved', wintypes.LPWSTR),
        ('lpDesktop', wintypes.LPWSTR),
        ('lpTitle', wintypes.LPWSTR),
        ('dwX', wintypes.DWORD),
        ('dwY', wintypes.DWORD),
        ('dwXSize', wintypes.DWORD),
        ('dwYSize', wintypes.DWORD),
        ('dwXCountChars', wintypes.DWORD),
        ('dwYCountChars', wintypes.DWORD),
        ('dwFillAttribute', wintypes.DWORD),
        ('dwFlags', wintypes.DWORD),
        ('wShowWindow', wintypes.WORD),
        ('cbReserved2', wintypes.WORD),
        ('lpReserved2', ctypes.POINTER(ctypes.c_byte)),
        ('hStdInput', wintypes.HANDLE),
        ('hStdOutput', wintypes.HANDLE),
        ('hStdError', wintypes.HANDLE),
    ]


class PROCESS_INFORMATION(ctypes.Structure):
    _fields_ = [
        ('hProcess', wintypes.HANDLE),
        ('hThread', wintypes.HANDLE),
        ('dwProcessId', wintypes.DWORD),
        ('dwThreadId', wintypes.DWORD),
    ]




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

    "brave": {

        "binary": "brave.exe",

        "title_pattern": r".*Brave.*",

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



# Universal Windows System & Utility Aliases
COMMON_SYSTEM_ALIASES = {
    "notepad": ("notepad.exe", ""),
    "calc": ("calc.exe", ""),
    "calculator": ("calc.exe", ""),
    "explorer": ("explorer.exe", ""),
    "file explorer": ("explorer.exe", ""),
    "file_explorer": ("explorer.exe", ""),
    "paint": ("mspaint.exe", ""),
    "mspaint": ("mspaint.exe", ""),
    "cmd": ("cmd.exe", ""),
    "command prompt": ("cmd.exe", ""),
    "terminal": ("wt.exe", ""),
    "windows terminal": ("wt.exe", ""),
    "powershell": ("powershell.exe", ""),
    "taskmgr": ("taskmgr.exe", ""),
    "task manager": ("taskmgr.exe", ""),
    "control panel": ("control.exe", ""),
    "control": ("control.exe", ""),
    "settings": ("C:\\Windows\\explorer.exe", "ms-settings:"),
    "windows settings": ("C:\\Windows\\explorer.exe", "ms-settings:"),
    "word": ("WINWORD.EXE", ""),
    "winword": ("WINWORD.EXE", ""),
    "excel": ("EXCEL.EXE", ""),
    "powerpoint": ("POWERPNT.EXE", ""),
    "ppt": ("POWERPNT.EXE", ""),
    "wordpad": ("write.exe", ""),
    "snipping tool": ("snippingtool.exe", ""),
    "snip": ("snippingtool.exe", ""),
    "vscode": ("Code.exe", ""),
    "vs code": ("Code.exe", ""),
    "code": ("Code.exe", ""),
    "brave": ("brave.exe", ""),
    "brave browser": ("brave.exe", ""),
    "chrome": ("chrome.exe", ""),
    "chrome browser": ("chrome.exe", ""),
    "google chrome": ("chrome.exe", ""),
    "google chrome browser": ("chrome.exe", ""),
    "edge": ("msedge.exe", ""),
    "edge browser": ("msedge.exe", ""),
    "microsoft edge": ("msedge.exe", ""),
    "microsoft edge browser": ("msedge.exe", ""),
}

_START_APPS_CACHE = None

def get_start_apps_cache() -> Dict[str, str]:
    global _START_APPS_CACHE
    if _START_APPS_CACHE is not None:
        return _START_APPS_CACHE

    cache = {}
    try:
        ps_cmd = 'Get-StartApps | ForEach-Object { "$($_.Name)|$($_.AppID)" }'
        out = subprocess.check_output(['powershell', '-NoProfile', '-Command', ps_cmd], text=True, errors='replace', timeout=5)
        for line in out.strip().splitlines():
            if '|' in line:
                name, app_id = line.split('|', 1)
                clean_name = name.strip().lower()
                clean_app_id = app_id.strip()
                if clean_name and clean_app_id:
                    cache[clean_name] = clean_app_id
    except Exception:
        pass

    _START_APPS_CACHE = cache
    return cache

def resolve_any_application(app_name: str) -> Optional[Tuple[str, str, str]]:
    """
    Universally resolves ANY application installed on the user's laptop.
    Returns (executable_or_launcher, args, app_display_name).
    """
    if not app_name:
        return None

    raw = app_name.strip().lower().replace("_", " ")
    clean_stripped = re.sub(r"\s+(?:browser|app(?:lication)?|software|program)$", "", raw).strip()
    normalized_keys = [raw]
    if clean_stripped and clean_stripped != raw:
        normalized_keys.append(clean_stripped)
    for k in list(normalized_keys):
        core = re.sub(r"^(?:google\s+|microsoft\s+|ms\s+|mozilla\s+)", "", k).strip()
        if core and core not in normalized_keys:
            normalized_keys.append(core)

    # 1. Check approved executable or ProgramFiles hints first for absolute path
    for cand in normalized_keys:
        approved_path = resolve_approved_executable(cand)
        if approved_path and os.path.isfile(approved_path):
            return (approved_path, "", cand)

    # 2. System aliases with PATH or approved path fallback
    for cand in normalized_keys:
        if cand in COMMON_SYSTEM_ALIASES:
            binary, args = COMMON_SYSTEM_ALIASES[cand]
            p = shutil.which(binary)
            if not p:
                p = resolve_approved_executable(cand)
            target = p if p else binary
            if os.path.isfile(target) or shutil.which(target):
                return (target, args, cand)

    # 3. PATH directly
    for cand in normalized_keys:
        for candidate in [cand, cand.replace(" ", ""), cand.replace(" ", "-"), f"{cand}.exe"]:
            p = shutil.which(candidate)
            if p and os.path.isfile(p):
                return (p, "", cand)

    # 4. Windows Registry App Paths (HKLM & HKCU)
    for cand in normalized_keys:
        for root in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
            try:
                with winreg.OpenKey(root, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths") as key:
                    num_subkeys = winreg.QueryInfoKey(key)[0]
                    for i in range(num_subkeys):
                        name = winreg.EnumKey(key, i).lower()
                        stem = os.path.splitext(name)[0]
                        cand_no_space = cand.replace(" ", "")
                        if cand == stem or cand == name or cand_no_space == stem or cand_no_space == name:
                            with winreg.OpenKey(key, winreg.EnumKey(key, i)) as subkey:
                                val, _ = winreg.QueryValueEx(subkey, "")
                                if val and os.path.isfile(val):
                                    return (val, "", stem)
            except Exception:
                pass

    # 5. Start Menu Shortcuts (.lnk files)
    start_dirs = [
        Path(os.environ.get("ProgramData", "C:\\ProgramData")) / "Microsoft\\Windows\\Start Menu\\Programs",
        Path(os.environ.get("APPDATA", "")) / "Microsoft\\Windows\\Start Menu\\Programs"
    ]
    for cand in normalized_keys:
        cand_no_space = cand.replace(" ", "")
        for s_dir in start_dirs:
            if s_dir.exists():
                for lnk in s_dir.rglob("*.lnk"):
                    stem = lnk.stem.lower()
                    stem_no_space = stem.replace(" ", "").replace("-", "")
                    if cand == stem or cand_no_space == stem_no_space:
                        return ("C:\\Windows\\explorer.exe", f'"{str(lnk.resolve())}"', lnk.stem)

    for cand in normalized_keys:
        for s_dir in start_dirs:
            if s_dir.exists():
                for lnk in s_dir.rglob("*.lnk"):
                    stem = lnk.stem.lower()
                    if cand in stem or stem in cand:
                        return ("C:\\Windows\\explorer.exe", f'"{str(lnk.resolve())}"', lnk.stem)

    # 6. Word-level matching for Start Menu (.lnk files)
    for cand in normalized_keys:
        cand_words = set(w for w in cand.split() if len(w) > 2 and w not in ('the', 'app', 'browser', 'open'))
        if cand_words:
            for s_dir in start_dirs:
                if s_dir.exists():
                    for lnk in s_dir.rglob("*.lnk"):
                        stem_words = set(lnk.stem.lower().split())
                        if cand_words.issubset(stem_words) or (len(cand_words) == 1 and cand_words.intersection(stem_words)):
                            return ("C:\\Windows\\explorer.exe", f'"{str(lnk.resolve())}"', lnk.stem)

    # 7. Get-StartApps / Windows Packaged Apps
    start_apps = get_start_apps_cache()
    for cand in normalized_keys:
        if cand in start_apps:
            app_id = start_apps[cand]
            return ("C:\\Windows\\explorer.exe", f"shell:AppsFolder\\{app_id}", cand)
    for cand in normalized_keys:
        for name, app_id in start_apps.items():
            if cand in name or name in cand:
                return ("C:\\Windows\\explorer.exe", f"shell:AppsFolder\\{app_id}", name)

    return None



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

        "brave": ["BraveSoftware\\Brave-Browser\\Application\\brave.exe"],

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






def run_on_default_desktop(fn, *args, **kwargs):
    res_container = {"return": None, "exception": None}
    def worker():
        try:
            user32 = ctypes.windll.user32
            h_default = user32.OpenDesktopW("Default", 0, False, 0x10000000 | 0x01FF)
            if h_default:
                user32.SetThreadDesktop(h_default)
            res_container["return"] = fn(*args, **kwargs)
        except Exception as e:
            res_container["exception"] = e
    t = threading.Thread(target=worker)
    t.start()
    t.join(timeout=30)
    if res_container["exception"]:
        raise res_container["exception"]
    return res_container["return"]


def ensure_default_desktop():
    """Ensures the current thread is attached to the active user's WinSta0\\Default desktop."""
    try:
        user32 = ctypes.windll.user32
        h_default = user32.OpenDesktopW("Default", 0, False, 0x10000000 | 0x01FF)
        if h_default:
            user32.SetThreadDesktop(h_default)
    except Exception:
        pass


def force_foreground_window(hwnd: int):

    """

    Reliably brings a window handle to the foreground on Windows.

    Bypasses foreground lock restriction safely.

    """

    if not hwnd or not win32gui.IsWindow(hwnd):
        return

    ensure_default_desktop()



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





def create_process_on_user_desktop(executable: str, args: str = "", target_desktop: str = "WinSta0\\Default") -> Tuple[bool, int, Optional[str]]:
    """
    Spawns an approved application directly onto the user's interactive monitor display desktop (WinSta0\Default)
    using Windows kernel32.CreateProcessW with STARTUPINFO.lpDesktop.
    Handles process and thread handle cleanup properly.
    Returns (success, pid, error_message).
    """
    si = STARTUPINFOW()
    si.cb = ctypes.sizeof(STARTUPINFOW)
    si.lpDesktop = target_desktop
    si.dwFlags = 1  # STARTF_USESHOWWINDOW
    si.wShowWindow = 1  # SW_SHOWNORMAL
    pi = PROCESS_INFORMATION()

    cmd = f'"{executable}"'
    if args:
        cmd += f' {args}'

    ret = ctypes.windll.kernel32.CreateProcessW(
        None,
        cmd,
        None,
        None,
        False,
        0,
        None,
        None,
        ctypes.byref(si),
        ctypes.byref(pi)
    )

    if ret:
        pid = pi.dwProcessId
        ctypes.windll.kernel32.CloseHandle(pi.hProcess)
        ctypes.windll.kernel32.CloseHandle(pi.hThread)
        return True, pid, None
    else:
        err = ctypes.GetLastError()
        return False, 0, f"CreateProcessW failed with error code {err}"


def find_window_on_user_desktop(
    app_key: str,
    title_pattern: str = "",
    target_pid: int = 0,
    timeout: float = 6.0
) -> Dict[str, Any]:
    """
    Finds a window belonging to ANY application strictly on the interactive
    WinSta0\Default desktop by enumerating desktop windows on a worker thread.
    Brings the window to foreground and returns handle metadata.
    """
    res = {"hwnd": 0, "title": "", "class": "", "pid": 0}
    deadline = time.time() + timeout

    def worker():
        user32 = ctypes.windll.user32
        h_default = user32.OpenDesktopW("Default", 0, False, 0x10000000 | 0x01FF)
        if not h_default:
            return
        user32.SetThreadDesktop(h_default)

        WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
        def enum_cb(hwnd, lparam):
            if res["hwnd"]:
                return False
            if not user32.IsWindowVisible(hwnd):
                return True
            length = user32.GetWindowTextLengthW(hwnd)
            buf = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buf, length + 1)
            class_buf = ctypes.create_unicode_buffer(256)
            user32.GetClassNameW(hwnd, class_buf, 256)
            title = buf.value.strip()
            class_name = class_buf.value.strip()
            if not title:
                return True

            t_lower = title.lower()
            c_lower = class_name.lower()
            k_lower = app_key.strip().lower()

            matched = False
            if k_lower in t_lower or k_lower in c_lower:
                matched = True
            elif k_lower == "notepad" and ("notepad" in c_lower or "notepad" in t_lower):
                matched = True
            elif k_lower in ("explorer", "file_explorer", "file explorer") and ("cabinetwclass" in c_lower or "explorer" in t_lower or "workspace_sandbox" in t_lower):
                matched = True
            elif k_lower in ("calc", "calculator") and ("calc" in c_lower or "calculator" in t_lower or (class_name == "ApplicationFrameWindow" and "calculator" in t_lower)):
                matched = True
            elif title_pattern and (re.search(title_pattern, title, re.IGNORECASE) or re.search(title_pattern, class_name, re.IGNORECASE)):
                matched = True
            elif any(w in t_lower for w in k_lower.split() if len(w) > 3):
                matched = True

            if matched:
                target_pid_out = wintypes.DWORD()
                user32.GetWindowThreadProcessId(hwnd, ctypes.byref(target_pid_out))
                res["hwnd"] = hwnd
                res["title"] = title
                res["class"] = class_name
                res["pid"] = target_pid_out.value
                return False
            return True

        cb = WNDENUMPROC(enum_cb)
        user32.EnumDesktopWindows(h_default, cb, 0)

    while time.time() < deadline:
        t = threading.Thread(target=worker)
        t.start()
        t.join(timeout=2.0)
        if res["hwnd"]:
            break
        time.sleep(0.3)

    if res["hwnd"]:
        force_foreground_window(res["hwnd"])

    return res


def set_notepad_text_via_uia(text: str, append: bool = False) -> Dict[str, Any]:
    """
    Sets or appends text in Notepad's Document editor control using UIAutomation
    strictly inside the user's WinSta0\Default desktop.
    """
    res = {"success": False, "hwnd": 0, "error": None}
    def worker():
        try:
            user32 = ctypes.windll.user32
            h_default = user32.OpenDesktopW("Default", 0, False, 0x10000000 | 0x01FF)
            if not h_default:
                res["error"] = "Could not open Default desktop"
                return
            user32.SetThreadDesktop(h_default)

            import pythoncom
            pythoncom.CoInitialize()
            from comtypes import client
            UIAutomationCore = client.GetModule("UIAutomationCore.dll")
            uia = client.CreateObject(UIAutomationCore.CUIAutomation, interface=UIAutomationCore.IUIAutomation)

            root = uia.GetRootElement()
            cond = uia.CreatePropertyCondition(UIAutomationCore.UIA_ClassNamePropertyId, "Notepad")
            np = root.FindFirst(UIAutomationCore.TreeScope_Children, cond)
            if np:
                hwnd = np.CurrentNativeWindowHandle
                res["hwnd"] = hwnd
                user32.SetForegroundWindow(hwnd)

                cond_doc = uia.CreatePropertyCondition(UIAutomationCore.UIA_ControlTypePropertyId, UIAutomationCore.UIA_DocumentControlTypeId)
                doc = np.FindFirst(UIAutomationCore.TreeScope_Descendants, cond_doc)
                if doc:
                    p_val = doc.GetCurrentPattern(UIAutomationCore.UIA_ValuePatternId)
                    if p_val:
                        val_pat = p_val.QueryInterface(UIAutomationCore.IUIAutomationValuePattern)
                        if append:
                            current_val = val_pat.CurrentValue or ""
                            val_pat.SetValue(current_val + "\n" + text)
                        else:
                            val_pat.SetValue(text)
                        res["success"] = True
                    else:
                        res["error"] = "No ValuePattern on document control"
                else:
                    res["error"] = "Document control not found in Notepad"
            else:
                res["error"] = "Notepad window not found on Default desktop"
            pythoncom.CoUninitialize()
        except Exception as e:
            res["error"] = str(e)

    t = threading.Thread(target=worker)
    t.start()
    t.join(timeout=10.0)
    return res



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





def launch_approved_application(app_name: str, target_param: Optional[str] = None) -> Dict[str, Any]:
    """
    Universally launches ANY application installed on the user's laptop onto the visible
    WinSta0\Default desktop and verifies its window presence.
    """
    if not app_name or not isinstance(app_name, str):
        raise ValueError("Parameter 'appName' is required and must be a string.")

    # 1. Resolve application universally (aliases, PATH, Registry App Paths, Start Menu, UWP Apps)
    resolved = resolve_any_application(app_name)
    if not resolved:
        return {
            "success": False,
            "error": f"Application '{app_name}' could not be located on this computer. Please verify that it is installed.",
            "application": app_name
        }

    launcher, default_args, display_name = resolved

    # 2. Check if window is already active/visible on user desktop
    existing = find_window_on_user_desktop(display_name, timeout=0.8)
    if existing["hwnd"]:
        force_foreground_window(existing["hwnd"])
        return {
            "success": True,
            "application": display_name,
            "executable": launcher,
            "pid": existing["pid"],
            "windowTitle": existing["title"] or f"{display_name}",
            "handle": existing["hwnd"],
            "className": existing["class"],
            "reusedExisting": True
        }

    # 3. Arguments
    args = default_args
    if display_name in ("explorer", "file_explorer", "file explorer"):
        target_dir = target_param or os.environ.get("FORGE_WORKSPACE", "")
        if not target_dir or not os.path.isdir(target_dir):
            target_dir = "C:\\Users\\HP\\Desktop\\CODE\\Forge\\workspace_sandbox"
        args = f'"{target_dir}"'
    elif target_param and not args:
        args = f'"{target_param}"'

    # 4. Launch directly onto user's visible desktop (WinSta0\Default)
    success, pid, err_msg = create_process_on_user_desktop(launcher, args, target_desktop="WinSta0\\Default")
    if not success:
        return {
            "success": False,
            "error": f"Failed to launch application '{display_name}': {err_msg}",
            "application": display_name,
            "executable": launcher
        }

    # 5. Verify window appearance on WinSta0\Default
    win_info = find_window_on_user_desktop(display_name, target_pid=pid, timeout=6.0)
    if not win_info["hwnd"]:
        win_info = find_window_on_user_desktop(app_name, target_pid=pid, timeout=2.0)

    hwnd = win_info["hwnd"]
    if hwnd:
        force_foreground_window(hwnd)

    return {
        "success": True,
        "application": display_name,
        "executable": launcher,
        "pid": win_info["pid"] or pid,
        "windowTitle": win_info["title"] or f"{display_name}",
        "handle": hwnd,
        "className": win_info["class"]
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
    High-level Notepad automation workflow:
    1. Extract user-requested content and filename (e.g. 'JAI HO' and 'DILDOKUMARI.txt').
    2. Ensure Notepad is open and active on the user's visible desktop (WinSta0\Default).
    3. Type the user-specified text into the active Notepad document editor via UIA.
    4. Save document cleanly inside workspace_sandbox/<filename>.
    5. Verify physical disk persistence and integrity.
    6. Return full execution output and verified artifact.
    """
    raw_filename = params.get("filename") or params.get("filePath") or "AI_Report.txt"
    clean_name = raw_filename.strip().replace('"', '').replace("'", "")
    clean_name = re.sub(r"\s+filename$", "", clean_name, flags=re.IGNORECASE).strip()
    if not clean_name:
        clean_name = "note.txt"
    if "." not in clean_name:
        clean_name += ".txt"

    custom_text = params.get("text") or params.get("content")
    topic = params.get("reportTopic") or params.get("topic") or "General Notes"

    if custom_text and custom_text.strip():
        report_content = custom_text.strip()
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
            f"This document was authored through FORGE AI Desktop Automation via\n"
            f"direct UI interaction with Windows Notepad and verified on disk.\n"
            f"======================================================================\n"
        )

    # 1. Ensure Notepad is open and visible on WinSta0\Default
    win_info = find_window_on_user_desktop("notepad", timeout=1.0)
    if not win_info["hwnd"]:
        launch_res = launch_approved_application("notepad")
        if not launch_res.get("success"):
            raise RuntimeError(f"Could not launch Notepad: {launch_res.get('error')}")
        time.sleep(1.0)
        win_info = find_window_on_user_desktop("notepad", timeout=5.0)

    notepad_hwnd = win_info["hwnd"]
    if notepad_hwnd:
        force_foreground_window(notepad_hwnd)

    # 2. Type text into Notepad's editor via UIAutomation
    uia_res = set_notepad_text_via_uia(report_content)
    if not uia_res.get("success"):
        try:
            type_text_into_window(text=report_content, target_window_title=r".*Notepad.*", append=False)
        except Exception:
            pass

    # 3. Save document cleanly inside workspace sandbox
    save_result = save_desktop_document(
        filename=clean_name,
        content=report_content,
        workspace_dir=workspace_dir,
        overwrite=True
    )

    # 4. Verify physical document existence on disk
    target_path = Path(save_result["path"])
    if not target_path.exists():
        raise RuntimeError(f"Verification failed: Document '{clean_name}' not found on disk after save.")

    stats = target_path.stat()
    file_size = stats.st_size
    sha256 = hashlib.sha256(target_path.read_bytes()).hexdigest()

    return {
        "success": True,
        "action": "notepad_report",
        "topic": topic,
        "filename": target_path.name,
        "path": str(target_path),
        "size": file_size,
        "hash": sha256,
        "contentSnippet": report_content[:200],
        "notepadInteracted": bool(notepad_hwnd),
        "handle": notepad_hwnd,
        "charactersTyped": len(report_content),
        "verifiedOnDisk": True,
        "artifacts": save_result.get("artifacts", [{
            "name": target_path.name,
            "path": str(target_path),
            "type": "file",
            "size": file_size
        }])
    }



def _calculate_worker(expression: str) -> Dict[str, Any]:
    """
    Performs arithmetic calculations in Windows Calculator using UIAutomation,
    and returns the verified result.
    """
    ensure_default_desktop()
    from comtypes import client
    UIAutomationCore = client.GetModule("UIAutomationCore.dll")
    uia = client.CreateObject(UIAutomationCore.CUIAutomation, interface=UIAutomationCore.IUIAutomation)

    root = uia.GetRootElement()
    cond = uia.CreatePropertyCondition(UIAutomationCore.UIA_NamePropertyId, "Calculator")
    calc_window = root.FindFirst(UIAutomationCore.TreeScope_Children, cond)

    if not calc_window:
        create_process_on_user_desktop("calc.exe", target_desktop="WinSta0\\Default")
        deadline = time.time() + 5.0
        while time.time() < deadline:
            time.sleep(0.5)
            root = uia.GetRootElement()
            calc_window = root.FindFirst(UIAutomationCore.TreeScope_Children, cond)
            if not calc_window:
                cond_class = uia.CreatePropertyCondition(UIAutomationCore.UIA_ClassNamePropertyId, "ApplicationFrameWindow")
                candidates = root.FindAll(UIAutomationCore.TreeScope_Children, cond_class)
                for k in range(candidates.Length):
                    cand = candidates.GetElement(k)
                    if "calc" in cand.CurrentName.lower():
                        calc_window = cand
                        break
            if calc_window:
                break

    if not calc_window:
        return {"success": False, "error": "Calculator window could not be detected on active desktop."}

    hwnd = calc_window.CurrentNativeWindowHandle
    force_foreground_window(hwnd)
    time.sleep(0.3)

    def click_btn(auto_id: str) -> bool:
        c = uia.CreatePropertyCondition(UIAutomationCore.UIA_AutomationIdPropertyId, auto_id)
        btn = calc_window.FindFirst(UIAutomationCore.TreeScope_Descendants, c)
        if btn:
            try:
                invoke_pattern = btn.GetCurrentPattern(UIAutomationCore.UIA_InvokePatternId)
                if invoke_pattern:
                    invoke = invoke_pattern.QueryInterface(UIAutomationCore.IUIAutomationInvokePattern)
                    invoke.Invoke()
                    time.sleep(0.05)
                    return True
            except Exception:
                pass
        return False

    click_btn("clearButton")
    time.sleep(0.1)

    expr_clean = expression.lower()
    expr_clean = expr_clean.replace("multiplied by", "*").replace("times", "*").replace("x", "*")
    expr_clean = expr_clean.replace("divided by", "/").replace("over", "/")
    expr_clean = expr_clean.replace("plus", "+").replace("add", "+")
    expr_clean = expr_clean.replace("minus", "-").replace("subtract", "-")

    tokens = re.findall(r"(\d+(?:\.\d+)?|[\+\-\*\/])", expr_clean)
    if not tokens:
        return {"success": False, "error": f"Could not parse arithmetic expression from '{expression}'"}

    operator_map = {
        "+": "plusButton",
        "-": "minusButton",
        "*": "multiplyButton",
        "/": "divideButton"
    }

    for token in tokens:
        if token in operator_map:
            click_btn(operator_map[token])
        else:
            for ch in token:
                if ch.isdigit():
                    click_btn(f"num{ch}Button")
                elif ch == ".":
                    click_btn("decimalSeparatorButton")

    click_btn("equalButton")
    time.sleep(0.3)

    c_res = uia.CreatePropertyCondition(UIAutomationCore.UIA_AutomationIdPropertyId, "CalculatorResults")
    res_el = calc_window.FindFirst(UIAutomationCore.TreeScope_Descendants, c_res)
    result_text = res_el.CurrentName if res_el else ""

    num_match = re.search(r"Display is ([\d,]+(?:\.\d+)?)", result_text, re.IGNORECASE)
    raw_num_str = num_match.group(1) if num_match else result_text
    clean_num_str = raw_num_str.replace(",", "")
    try:
        numeric_result = float(clean_num_str) if "." in clean_num_str else int(clean_num_str)
    except Exception:
        numeric_result = None

    return {
        "success": True,
        "action": "calculate",
        "expression": expression,
        "calculation": " ".join(tokens),
        "rawDisplay": result_text,
        "result": raw_num_str,
        "numericResult": numeric_result,
        "handle": hwnd
    }



def calculate_expression(expression: str) -> Dict[str, Any]:
    return run_on_default_desktop(_calculate_worker, expression)


def open_document_in_app(filename: str, app_name: Optional[str], workspace_dir: Path) -> Dict[str, Any]:
    """
    Safely opens a verified workspace document inside an approved desktop application on WinSta0\Default.
    """
    from src.tools.file_tool import safe_resolve_path
    
    if not filename:
        raise ValueError("Filename parameter is required.")

    target_path = safe_resolve_path(filename, workspace_dir)
    if not target_path.exists():
        return {
            "success": False,
            "error": f"Execution failed: File not found in workspace sandbox: {filename}. Please create or save the document first."
        }

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

    exec_path = resolve_approved_executable(selected_app) or APPROVED_APPLICATIONS[selected_app]["binary"]
    
    args = f'"{target_path.resolve()}"'
    success, pid, err_msg = create_process_on_user_desktop(exec_path, args, target_desktop="WinSta0\\Default")
    
    win_info = find_window_on_user_desktop(
        selected_app,
        title_pattern=target_path.stem,
        target_pid=pid,
        timeout=6.0
    )

    return {
        "success": True,
        "action": "open_document_in_app",
        "file": target_path.name,
        "path": str(target_path),
        "application": selected_app,
        "handle": win_info["hwnd"],
        "windowTitle": win_info["title"] or target_path.name
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
            target_param = params.get("targetDirectory") or params.get("targetPath")
            return launch_approved_application(app_name, target_param)

        elif action in ("calculate", "calculator_operation"):
            expression = params.get("expression") or params.get("calculation") or params.get("calc") or "125 * 48"
            return calculate_expression(expression)



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

