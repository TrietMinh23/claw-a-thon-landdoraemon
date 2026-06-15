import sys, os, io
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from parser import parse_participants
import openpyxl

def _make_xlsx(rows: list[list]) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()

def test_parse_xlsx_basic():
    data = _make_xlsx([
        ["No.", "Domain", "Email", "Full name", "Dept", "Group", "Line manager", "Title", "HRBP", "Session"],
        [1, "Tech", "a@zp.vn", "Nguyen Van A", "Engineering", "Platform", "Manager B", "Engineer", "HRBP C", "Session 1"],
        [2, "Biz", "b@zp.vn", "Tran Thi B", "Product", "Mobile", "Manager D", "PM", "HRBP E", "Session 2"],
    ])
    result = parse_participants(data, "test.xlsx")
    assert len(result) == 2
    assert result[0]["name"] == "Nguyen Van A"
    assert result[0]["email"] == "a@zp.vn"
    assert result[0]["hrbp"] == "HRBP C"
    assert result[0]["session"] == "Session 1"

def test_parse_skips_empty_rows():
    data = _make_xlsx([
        ["No.", "Domain", "Email", "Full name", "Dept", "Group", "Line manager", "Title", "HRBP", "Session"],
        [1, "Tech", "a@zp.vn", "Nguyen Van A", "Engineering", "Platform", "Manager B", "Engineer", "HRBP C", "Session 1"],
        [None, None, None, None, None, None, None, None, None, None],
    ])
    result = parse_participants(data, "test.xlsx")
    assert len(result) == 1

def test_parse_csv_basic():
    csv_bytes = b"No.,Domain,Email,Full name,Dept,Group,Line manager,Title,HRBP,Session\n1,Tech,a@zp.vn,Nguyen Van A,Engineering,Platform,Manager B,Engineer,HRBP C,Session 1\n"
    result = parse_participants(csv_bytes, "test.csv")
    assert len(result) == 1
    assert result[0]["name"] == "Nguyen Van A"
