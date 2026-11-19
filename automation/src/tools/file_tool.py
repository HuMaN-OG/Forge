import os
import shutil
import json
import csv
import fnmatch
from pathlib import Path
from typing import Dict, Any, List, Optional

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
      - write_file / create_file
      - copy_file
      - move_file / rename_file
      - create_directory / create_folder
      - delete_file
      - search_files / find_files
      - get_file_info
      - edit_file / append_file
      - organize_by_extension
    """
    raw_action = params.get("action", "list_directory")
    action = raw_action.lower()
    if action.startswith("file_system."):
        action = action[len("file_system."):]
    elif action.startswith("fs."):
        action = action[len("fs."):]

    try:
        if action == "list_directory":
            rel_dir = params.get("targetDirectory") or params.get("directory") or "."
            target_dir = safe_resolve_path(rel_dir, workspace_dir)

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

        elif action in ("create_directory", "create_folder"):
            rel_dir = params.get("targetDirectory") or params.get("directory") or params.get("folderName") or params.get("name") or params.get("path")
            if not rel_dir:
                return {"success": False, "error": "Missing required parameter 'targetDirectory' or 'folderName'"}

            target_dir = safe_resolve_path(rel_dir, workspace_dir)
            target_dir.mkdir(parents=True, exist_ok=True)
            rel_str = str(target_dir.relative_to(workspace_dir.resolve()))

            return {
                "success": True,
                "action": action,
                "folder": target_dir.name,
                "relativePath": rel_str,
                "path": str(target_dir)
            }

        elif action in ("write_file", "create_file"):
            rel_file = params.get("targetFile") or params.get("filePath") or params.get("file") or params.get("path")
            if not rel_file:
                return {"success": False, "error": "Missing required parameter 'targetFile' or 'filePath'"}

            target_file = safe_resolve_path(rel_file, workspace_dir)
            overwrite = bool(params.get("overwrite", False))

            if target_file.exists() and not overwrite:
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
            rel_file = params.get("targetFile") or params.get("filePath") or params.get("file") or params.get("path")
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
            src_rel = params.get("sourceFile") or params.get("source") or params.get("src")
            dst_rel = params.get("destinationFile") or params.get("destination") or params.get("dst")
            if not src_rel or not dst_rel:
                return {"success": False, "error": "Missing 'sourceFile' or 'destinationFile'"}

            src = safe_resolve_path(src_rel, workspace_dir)
            if not src.exists() or not src.is_file():
                return {"success": False, "error": f"Source file does not exist: {src_rel}"}

            dst = safe_resolve_path(dst_rel, workspace_dir)
            # If destination is an existing directory, copy into it
            if dst.exists() and dst.is_dir():
                dst = dst / src.name

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
            src_rel = params.get("sourceFile") or params.get("source") or params.get("src")
            dst_rel = params.get("destinationFile") or params.get("destination") or params.get("dst") or params.get("newName")
            if not src_rel or not dst_rel:
                return {"success": False, "error": "Missing 'sourceFile' or 'destinationFile'"}

            src = safe_resolve_path(src_rel, workspace_dir)
            if not src.exists():
                return {"success": False, "error": f"Source file does not exist: {src_rel}"}

            dst = safe_resolve_path(dst_rel, workspace_dir)
            if dst.exists() and dst.is_dir():
                dst = dst / src.name

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

        elif action == "delete_file":
            rel_file = params.get("targetFile") or params.get("filePath") or params.get("file")
            if not rel_file:
                return {"success": False, "error": "Missing required parameter 'targetFile' or 'filePath'"}

            target = safe_resolve_path(rel_file, workspace_dir)
            if not target.exists():
                return {"success": False, "error": f"File does not exist: {rel_file}"}

            if target.resolve() == workspace_dir.resolve():
                return {"success": False, "error": "Security violation: cannot delete the workspace root directory."}

            if target.is_dir():
                shutil.rmtree(str(target))
            else:
                target.unlink()

            return {
                "success": True,
                "action": action,
                "file": target.name,
                "message": f"Successfully deleted '{target.name}' from workspace sandbox."
            }

        elif action in ("search_files", "find_files"):
            query = params.get("query") or params.get("pattern") or "*"
            rel_dir = params.get("targetDirectory") or "."
            search_root = safe_resolve_path(rel_dir, workspace_dir)
            if not search_root.exists() or not search_root.is_dir():
                return {"success": False, "error": f"Directory does not exist: {rel_dir}"}

            pattern = query if ("*" in query or "?" in query) else f"*{query}*"
            matches = []
            for p in search_root.rglob("*"):
                if p.is_file() and not p.name.startswith("."):
                    if fnmatch.fnmatch(p.name.lower(), pattern.lower()) or (query.lower() in p.name.lower()):
                        stat = p.stat()
                        matches.append({
                            "name": p.name,
                            "relativePath": str(p.relative_to(workspace_dir.resolve())),
                            "size": stat.st_size,
                            "modified": int(stat.st_mtime)
                        })

            return {
                "success": True,
                "action": action,
                "query": query,
                "count": len(matches),
                "matches": matches
            }

        elif action == "get_file_info":
            rel_file = params.get("targetFile") or params.get("filePath") or params.get("file")
            if not rel_file:
                return {"success": False, "error": "Missing required parameter 'targetFile'"}

            target = safe_resolve_path(rel_file, workspace_dir)
            if not target.exists():
                return {
                    "success": True,
                    "action": action,
                    "exists": False,
                    "file": target.name
                }

            stat = target.stat()
            return {
                "success": True,
                "action": action,
                "exists": True,
                "file": target.name,
                "relativePath": str(target.relative_to(workspace_dir.resolve())),
                "is_file": target.is_file(),
                "is_dir": target.is_dir(),
                "size": stat.st_size if target.is_file() else 0,
                "extension": target.suffix.lower(),
                "modified": int(stat.st_mtime),
                "created": int(stat.st_ctime)
            }

        elif action in ("edit_file", "append_file"):
            rel_file = params.get("targetFile") or params.get("filePath") or params.get("file")
            if not rel_file:
                return {"success": False, "error": "Missing required parameter 'targetFile'"}

            target_file = safe_resolve_path(rel_file, workspace_dir)
            if not target_file.exists():
                return {"success": False, "error": f"File does not exist in workspace sandbox: {rel_file}"}

            ext = target_file.suffix.lower()

            # 1. TXT / MD
            if ext in (".txt", ".md"):
                find_text = params.get("findText") or params.get("targetText")
                replace_text = params.get("replaceText") or params.get("replacement")
                append_text = params.get("appendText") or params.get("content") or params.get("text")

                if find_text:
                    orig = target_file.read_text(encoding="utf-8")
                    updated = orig.replace(find_text, replace_text or "")
                    target_file.write_text(updated, encoding="utf-8")
                elif append_text:
                    orig = target_file.read_text(encoding="utf-8") if target_file.stat().st_size > 0 else ""
                    with open(target_file, "a", encoding="utf-8") as f:
                        if orig and not orig.endswith("\n"):
                            f.write("\n")
                        f.write(append_text + "\n")
                else:
                    return {"success": False, "error": "No appendText or findText provided for editing text file."}

            # 2. CSV
            elif ext == ".csv":
                new_row = params.get("row") or params.get("newRow")
                new_rows = params.get("rows")
                content = params.get("content") or params.get("text")

                if new_row or new_rows:
                    rows_to_add = new_rows if new_rows else [new_row]
                    with open(target_file, "a", newline="", encoding="utf-8") as f:
                        writer = csv.writer(f)
                        for r in rows_to_add:
                            writer.writerow(r if isinstance(r, list) else [r])
                elif content:
                    with open(target_file, "a", encoding="utf-8") as f:
                        f.write(content + "\n")

            # 3. XLSX
            elif ext == ".xlsx":
                import openpyxl
                wb = openpyxl.load_workbook(str(target_file))
                sheet_name = params.get("sheetName")
                ws = wb[sheet_name] if sheet_name and sheet_name in wb.sheetnames else wb.active
                new_row = params.get("row") or params.get("newRow")
                new_rows = params.get("rows")
                if new_row:
                    ws.append(new_row if isinstance(new_row, list) else [new_row])
                if new_rows:
                    for r in new_rows:
                        ws.append(r if isinstance(r, list) else [r])
                wb.save(str(target_file))

            # 4. DOCX
            elif ext == ".docx":
                from docx import Document
                doc = Document(str(target_file))
                heading = params.get("heading") or params.get("sectionTitle") or params.get("title")
                level = params.get("level", 2)
                paragraph = params.get("paragraph") or params.get("content") or params.get("text")
                if heading:
                    doc.add_heading(heading, level=level)
                if paragraph:
                    doc.add_paragraph(paragraph)
                doc.save(str(target_file))

            # 5. PPTX
            elif ext == ".pptx":
                from pptx import Presentation
                prs = Presentation(str(target_file))
                layout_idx = 1 if len(prs.slide_layouts) > 1 else 0
                slide = prs.slides.add_slide(prs.slide_layouts[layout_idx])
                slide_title = params.get("title") or params.get("slideTitle") or "Updated Section"
                slide_content = params.get("content") or params.get("text") or ""
                if slide.shapes.title:
                    slide.shapes.title.text = slide_title
                if len(slide.placeholders) > 1 and slide_content:
                    slide.placeholders[1].text = slide_content
                prs.save(str(target_file))

            # 6. JSON
            elif ext == ".json":
                data = json.loads(target_file.read_text(encoding="utf-8"))
                key = params.get("key")
                value = params.get("value")
                updates = params.get("updates")
                append_item = params.get("appendItem") or params.get("item")

                if key:
                    data[key] = value
                elif updates and isinstance(updates, dict):
                    data.update(updates)
                elif append_item and isinstance(data, list):
                    data.append(append_item)
                target_file.write_text(json.dumps(data, indent=2), encoding="utf-8")

            # 7. PDF
            elif ext == ".pdf":
                from pypdf import PdfReader, PdfWriter
                reader = PdfReader(str(target_file))
                writer = PdfWriter()
                for page in reader.pages:
                    writer.add_page(page)
                # Save updated PDF
                writer.write(str(target_file))

            else:
                return {"success": False, "error": f"Editing unsupported for file format: '{ext}'"}

            file_size = target_file.stat().st_size
            rel_str = str(target_file.relative_to(workspace_dir.resolve()))

            return {
                "success": True,
                "action": action,
                "file": target_file.name,
                "relativePath": rel_str,
                "size": file_size,
                "artifacts": [{
                    "name": target_file.name,
                    "path": str(target_file),
                    "type": "file",
                    "size": file_size
                }]
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
