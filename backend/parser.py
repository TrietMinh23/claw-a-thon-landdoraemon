import csv
import io
import openpyxl


def parse_participants(file_bytes: bytes, filename: str) -> list[dict]:
    if filename.lower().endswith(".csv"):
        return _parse_csv(file_bytes)
    return _parse_xlsx(file_bytes)


def _parse_xlsx(file_bytes: bytes) -> list[dict]:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    header = [str(h).strip() if h else "" for h in rows[0]]
    col = {name: i for i, name in enumerate(header)}

    result = []
    for row in rows[1:]:
        if not any(row):
            continue
        result.append(_map_row(row, col))
    return result


def _parse_csv(file_bytes: bytes) -> list[dict]:
    text = file_bytes.decode("utf-8-sig")
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        return []
    header = [h.strip() for h in rows[0]]
    col = {name: i for i, name in enumerate(header)}

    result = []
    for row in rows[1:]:
        if not any(v.strip() for v in row):
            continue
        result.append(_map_row(row, col))
    return result


def _get(row, col: dict, *keys) -> str:
    for key in keys:
        if key in col:
            val = row[col[key]]
            return str(val).strip() if val is not None else ""
    return ""


def _map_row(row, col: dict) -> dict:
    return {
        "no": _get(row, col, "No."),
        "name": _get(row, col, "Full name"),
        "email": _get(row, col, "Email"),
        "dept": _get(row, col, "Dept"),
        "group": _get(row, col, "Group"),
        "hrbp": _get(row, col, "HRBP"),
        "session": _get(row, col, "Session"),
        "title": _get(row, col, "Title"),
        "line_manager": _get(row, col, "Line manager"),
    }
