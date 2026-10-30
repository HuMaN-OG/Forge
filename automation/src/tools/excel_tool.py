import os
import re
from pathlib import Path
from typing import Dict, Any, List
from src.tools.file_tool import safe_resolve_path, get_collision_safe_path

INVALID_SHEET_CHARS = re.compile(r'[\\/*?:\[\]]')

def validate_sheet_name(name: str) -> str:
    """Validates and cleans Excel sheet name (max 31 chars, no invalid chars)."""
    if not name or not name.strip():
        return "Sheet1"
    cleaned = INVALID_SHEET_CHARS.sub('_', name.strip())[:31]
    return cleaned or "Sheet1"


def execute_excel_tool(params: Dict[str, Any], workspace_dir: Path) -> Dict[str, Any]:
    """
    Safe registered Excel tool runner.
    Supported actions: create_workbook, add_sheet, write_data

    Strict Safety Rules:
      - NEVER invent spreadsheet rows if user did not provide them.
      - Reject execution if parameters are missing or incomplete.
      - Verify created workbook can be opened before reporting success.
      - Record real file size and real file path.
    """
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    except ImportError:
        return {
            "success": False,
            "error": "openpyxl is not installed in the Python runtime."
        }

    action = params.get("action", "create_workbook")
    rel_path = params.get("filePath")
    if not rel_path:
        return {
            "success": False,
            "error": "Missing required parameter 'filePath'. Target filename must be specified."
        }

    # Verify file extension
    if not (rel_path.lower().endswith(".xlsx") or rel_path.lower().endswith(".xlsm")):
        rel_path += ".xlsx"

    try:
        target_path = safe_resolve_path(rel_path, workspace_dir)
    except PermissionError as pe:
        return {"success": False, "error": str(pe)}

    # Ensure parent directory exists within sandbox
    target_path.parent.mkdir(parents=True, exist_ok=True)

    if not params.get("overwrite", False):
        target_path = get_collision_safe_path(target_path)

    if action in ("create_workbook", "write_data"):
        raw_headers = params.get("headers")
        raw_rows = params.get("rows")

        # Strict validation: Do not invent rows!
        if raw_headers is None and raw_rows is None:
            return {
                "success": False,
                "error": "Cannot create Excel spreadsheet: Structured parameters are incomplete. Please provide 'headers' and/or 'rows'. FORGE AI does not fabricate sample data."
            }

        headers = [str(h) for h in raw_headers] if isinstance(raw_headers, list) else []
        rows = raw_rows if isinstance(raw_rows, list) else []

        sheet_name = validate_sheet_name(params.get("sheetName", "Sheet1"))

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = sheet_name

        # Write and style headers if provided
        if headers:
            ws.append(headers)
            header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
            header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
            thin_border = Border(
                left=Side(style='thin', color='D9D9D9'),
                right=Side(style='thin', color='D9D9D9'),
                top=Side(style='thin', color='D9D9D9'),
                bottom=Side(style='thin', color='D9D9D9')
            )

            for col_idx in range(1, len(headers) + 1):
                cell = ws.cell(row=1, column=col_idx)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.border = thin_border

        # Write user-provided rows (NO fabricated rows!)
        for row_data in rows:
            if isinstance(row_data, list):
                ws.append(row_data)

        # Apply user-specified formulas if provided (format: {"F2": "=SUM(B2:E2)"})
        formulas = params.get("formulas")
        if isinstance(formulas, dict):
            for cell_ref, formula_val in formulas.items():
                if isinstance(formula_val, str) and formula_val.startswith("="):
                    try:
                        ws[cell_ref] = formula_val
                    except Exception as fe:
                        return {
                            "success": False,
                            "error": f"Invalid formula '{formula_val}' for cell '{cell_ref}': {str(fe)}"
                        }

        # Auto-adjust column widths
        for col in ws.columns:
            max_len = 0
            col_letter = col[0].column_letter
            for cell in col:
                val_str = str(cell.value or "")
                if len(val_str) > max_len:
                    max_len = len(val_str)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

        # Save the workbook to disk
        wb.save(str(target_path))

        # Verification step: Physically inspect workbook using openpyxl
        if not target_path.exists():
            return {
                "success": False,
                "error": "Verification failed: Excel file was not written to disk."
            }

        try:
            verify_wb = openpyxl.load_workbook(str(target_path), data_only=False)
            verify_sheets = verify_wb.sheetnames
            if sheet_name not in verify_sheets:
                return {
                    "success": False,
                    "error": f"Verification failed: Worksheet '{sheet_name}' was not found in saved workbook."
                }
            ws_verify = verify_wb[sheet_name]

            # 1. Verify headers
            if headers:
                first_row = [cell.value for cell in ws_verify[1]]
                while first_row and first_row[-1] is None:
                    first_row.pop()
                if [str(h).strip() for h in first_row] != [str(h).strip() for h in headers]:
                    return {
                        "success": False,
                        "error": f"Verification failed: Headers {first_row} do not match requested headers {headers}."
                    }

            # 2. Verify rows match user input
            if rows:
                actual_rows = []
                for r_idx in range(2, len(rows) + 2):
                    row_vals = [cell.value for cell in ws_verify[r_idx]]
                    actual_rows.append(row_vals[:len(rows[r_idx - 2])])

                for i, (expected, actual) in enumerate(zip(rows, actual_rows)):
                    for j, (exp_val, act_val) in enumerate(zip(expected, actual)):
                        if str(exp_val) != str(act_val):
                            return {
                                "success": False,
                                "error": f"Verification failed: Row {i+1} column {j+1} value '{act_val}' does not match expected '{exp_val}'."
                            }

            # 3. Verify formulas
            if isinstance(formulas, dict):
                for cell_ref, exp_f in formulas.items():
                    act_f = ws_verify[cell_ref].value
                    if str(act_f).upper() != str(exp_f).upper():
                        return {
                            "success": False,
                            "error": f"Verification failed: Cell {cell_ref} formula '{act_f}' does not match expected '{exp_f}'."
                        }

            verify_wb.close()
        except Exception as ve:
            return {
                "success": False,
                "error": f"Verification failed: Generated workbook failed validation checks ({str(ve)})"
            }

        file_size = target_path.stat().st_size
        return {
            "success": True,
            "action": action,
            "filePath": str(target_path),
            "relativePath": str(target_path.relative_to(workspace_dir.resolve())),
            "sheetName": sheet_name,
            "headers": headers,
            "rowCount": len(rows),
            "columnCount": len(headers) if headers else (len(rows[0]) if rows else 0),
            "verification": {
                "status": "passed",
                "verifiedHeaders": headers,
                "verifiedRowsCount": len(rows),
                "verifiedSheet": sheet_name,
                "verifiedFormulas": list(formulas.keys()) if isinstance(formulas, dict) else []
            },
            "artifacts": [{
                "name": target_path.name,
                "path": str(target_path),
                "type": "excel",
                "size": file_size
            }]
        }

    return {
        "success": False,
        "error": f"Unknown Excel action: '{action}'"
    }
