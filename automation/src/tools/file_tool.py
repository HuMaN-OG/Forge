import os
import shutil
from pathlib import Path
from typing import Dict, Any, List

def safe_resolve_path(rel_path: str, workspace_dir: Path) -> Path:
    """
    Resolves relative path inside workspace_dir.
    Guarantees that the resolved path is strictly within workspace_dir,
    preventing '../' traversal and symlink escapes.
    """
    resolved_workspace = workspace_dir.resolve()
    clean_rel = rel_path.lstrip("/\\") if rel_path else "."
    candidate = (resolved_workspace / clean_rel).resolve()

    try:
        candidate.relative_to(resolved_workspace)
    except ValueError:
        raise PermissionError(f"Access denied: path '{rel_path}' attempts to traverse outside the workspace sandbox.")

    # Prevent symlink escapes
    if candidate.is_symlink():
        target = candidate.resolve()
        try:
            target.relative_to(resolved_workspace)
        except ValueError:
            raise PermissionError(f"Access denied: symlink '{rel_path}' points outside the workspace sandbox.")

    return candidate


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


def execute_file_tool(params: Dict[str, Any], workspace_dir: Path) -> Dict[str, Any]:
    """
    Safe registered File System tool runner.
    Supported actions:
      - list_directory
      - read_file
      - write_file
      - copy_file
      - move_file
      - organize_by_extension
    """
    action = params.get("action", "list_directory")

    try:
        if action == "list_directory":
            rel_dir = params.get("targetDirectory", ".")
            target_dir = safe_resolve_path(rel_dir, workspace_dir)

            # Strictly do not create directory during read-only listing
            if not target_dir.exists():
                return {"success": False, "error": f"Directory does not exist: {rel_dir}"}
            if not target_dir.is_dir():
                return {"success": False, "error": f"Target is not a directory: {rel_dir}"}

            items = []
            for p in sorted(target_dir.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
                stat = p.stat()
                items.append({
                    "name": p.name,
                    "is_dir": p.is_dir(),
                    "size": stat.st_size if p.is_file() else 0,
                    "modified": int(stat.st_mtime)
                })

            return {
                "success": True,
                "action": action,
                "directory": str(target_dir.relative_to(workspace_dir.resolve())),
                "count": len(items),
                "items": items
            }

        elif action in ("write_file", "create_file"):
            rel_file = params.get("targetFile") or params.get("filePath")
            if not rel_file:
                return {"success": False, "error": "Missing required parameter 'targetFile' or 'filePath'"}

            target_file = safe_resolve_path(rel_file, workspace_dir)
            overwrite = bool(params.get("overwrite", False))

            if target_file.exists() and not overwrite:
                # Handle filename collision safely without silent overwriting
                target_file = get_collision_safe_path(target_file)

            target_file.parent.mkdir(parents=True, exist_ok=True)
            content = params.get("content", "")
            target_file.write_text(content, encoding="utf-8")

            file_size = target_file.stat().st_size
            rel_str = str(target_file.relative_to(workspace_dir.resolve()))

            return {
                "success": True,
                "action": action,
                "file": target_file.name,
                "path": str(target_file),
                "relativePath": rel_str,
                "size": file_size,
                "artifacts": [{
                    "name": target_file.name,
                    "path": str(target_file),
                    "type": "file",
                    "size": file_size
                }]
            }

        elif action == "read_file":
            rel_file = params.get("targetFile") or params.get("filePath")
            if not rel_file:
                return {"success": False, "error": "Missing required parameter 'targetFile'"}

            target_file = safe_resolve_path(rel_file, workspace_dir)
            if not target_file.exists():
                return {"success": False, "error": f"File does not exist: {rel_file}"}
            if not target_file.is_file():
                return {"success": False, "error": f"Target is not a file: {rel_file}"}

            file_size = target_file.stat().st_size
            if file_size > 10 * 1024 * 1024:
                return {"success": False, "error": "File exceeds maximum 10MB read limit."}

            content = target_file.read_text(encoding="utf-8", errors="replace")
            return {
                "success": True,
                "action": action,
                "file": target_file.name,
                "size": file_size,
                "content": content
            }

        elif action == "copy_file":
            src_rel = params.get("sourceFile")
            dst_rel = params.get("destinationFile")
            if not src_rel or not dst_rel:
                return {"success": False, "error": "Missing 'sourceFile' or 'destinationFile'"}

            src = safe_resolve_path(src_rel, workspace_dir)
            if not src.exists() or not src.is_file():
                return {"success": False, "error": f"Source file does not exist: {src_rel}"}

            dst = safe_resolve_path(dst_rel, workspace_dir)
            if dst.exists() and not params.get("overwrite", False):
                dst = get_collision_safe_path(dst)

            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(src), str(dst))

            return {
                "success": True,
                "action": action,
                "source": str(src.relative_to(workspace_dir.resolve())),
                "destination": str(dst.relative_to(workspace_dir.resolve())),
                "size": dst.stat().st_size
            }

        elif action in ("move_file", "rename_file"):
            src_rel = params.get("sourceFile")
            dst_rel = params.get("destinationFile")
            if not src_rel or not dst_rel:
                return {"success": False, "error": "Missing 'sourceFile' or 'destinationFile'"}

            src = safe_resolve_path(src_rel, workspace_dir)
            if not src.exists() or not src.is_file():
                return {"success": False, "error": f"Source file does not exist: {src_rel}"}

            dst = safe_resolve_path(dst_rel, workspace_dir)
            if dst.exists() and not params.get("overwrite", False):
                dst = get_collision_safe_path(dst)

            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dst))

            return {
                "success": True,
                "action": action,
                "source": str(src.relative_to(workspace_dir.resolve())),
                "destination": str(dst.relative_to(workspace_dir.resolve()))
            }

        elif action == "organize_by_extension":
            rel_dir = params.get("targetDirectory", ".")
            target_dir = safe_resolve_path(rel_dir, workspace_dir)
            if not target_dir.exists() or not target_dir.is_dir():
                return {"success": False, "error": f"Directory does not exist: {rel_dir}"}

            is_preview = bool(params.get("preview", False))

            categorization = {
                "excel": ["xlsx", "xls", "csv"],
                "documents": ["docx", "doc", "pdf", "txt", "md"],
                "images": ["png", "jpg", "jpeg", "svg", "webp"],
                "data": ["json", "xml", "yaml", "yml"]
            }

            proposed_moves = []
            for item in sorted(target_dir.iterdir()):
                if item.is_file() and not item.name.startswith("."):
                    ext = item.suffix.lstrip(".").lower()
                    folder_name = "MISC"
                    for cat, ext_list in categorization.items():
                        if ext in ext_list:
                            folder_name = cat.upper()
                            break
                    if folder_name == "MISC" and ext:
                        folder_name = ext.upper()

                    dest_path = target_dir / folder_name / item.name
                    proposed_moves.append({
                        "file": item.name,
                        "source": str(item.relative_to(workspace_dir.resolve())),
                        "destinationFolder": folder_name,
                        "targetPath": str(dest_path.relative_to(workspace_dir.resolve()))
                    })

            if is_preview:
                return {
                    "success": True,
                    "action": action,
                    "preview": True,
                    "count": len(proposed_moves),
                    "proposedMoves": proposed_moves
                }

            # Execute moves
            moved_count = 0
            for move in proposed_moves:
                dest_dir = target_dir / move["destinationFolder"]
                dest_dir.mkdir(exist_ok=True)
                src_file = target_dir / move["file"]
                dst_file = dest_dir / move["file"]
                if dst_file.exists():
                    dst_file = get_collision_safe_path(dst_file)
                shutil.move(str(src_file), str(dst_file))
                moved_count += 1

            return {
                "success": True,
                "action": action,
                "movedFilesCount": moved_count,
                "summary": f"Safely categorized {moved_count} file(s) into organized subdirectories."
            }

        return {"success": False, "error": f"Unknown or unsupported file action: '{action}'"}

    except PermissionError as pe:
        return {"success": False, "error": str(pe)}
    except Exception as e:
        return {"success": False, "error": f"File tool execution error: {str(e)}"}
