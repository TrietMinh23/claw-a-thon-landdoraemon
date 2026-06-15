import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from prompts import build_system_prompt

def test_build_system_prompt_invite_contains_sample():
    prompt = build_system_prompt("invite")
    assert "Starter thân mến" in prompt
    assert "Toro" in prompt

def test_build_system_prompt_include_fields():
    prompt = build_system_prompt(
        "invite",
        program_name="Test Workshop",
        purpose="Test Purpose",
        datetime="9:00 Thứ 4",
        location="Phòng B2",
        description="Mô tả test"
    )
    assert "Test Workshop" in prompt
    assert "Test Purpose" in prompt

def test_build_system_prompt_unknown_type_uses_custom():
    prompt = build_system_prompt("custom")
    assert "Toro" in prompt

def test_persona_instructs_html_output():
    from prompts import _TORO_PERSONA
    assert "HTML" in _TORO_PERSONA
    assert "<p>" in _TORO_PERSONA

def test_build_system_prompt_instructs_html_output():
    prompt = build_system_prompt("invite", program_name="Test workshop")
    assert "HTML" in prompt
