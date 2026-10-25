"""Heuristic extraction of named members and responsibilities from charter text."""

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class CharterMember:
    name: str
    role: str
    responsibilities: tuple[str, ...]


_NAME_ROLE_RE = re.compile(
    r"^([A-Za-z][A-Za-z .'\-]+?)\s*(?:—|–|-|:)\s*(.+?)\s*$"
)
_BULLET_RE = re.compile(r"^\s*[-•*]\s+(.+?)\s*$")
_SECTION_START_RE = re.compile(
    r"(?i)^(?:#{1,3}\s*)?(?:members(?:\s+and\s+roles)?|team\s+members|roles\s+and\s+responsibilities)\b"
)
_SECTION_END_RE = re.compile(
    r"(?i)^(?:#{1,3}\s*)?(?:team\s+norms|norms|values|goals|communication|meetings)\b"
)
_TITLE_NOISE_RE = re.compile(
    r"(?i)\b(charter|semester|fall|spring|summer|winter|project\s+group|course)\b"
)


def _charter_member_section(charter_text: str) -> str:
    lines = charter_text.splitlines()
    start = 0
    for i, raw in enumerate(lines):
        if _SECTION_START_RE.match(raw.strip()):
            start = i + 1
            break

    end = len(lines)
    for i in range(start, len(lines)):
        if _SECTION_END_RE.match(lines[i].strip()):
            end = i
            break

    if start > 0:
        return "\n".join(lines[start:end])

    return charter_text


def _looks_like_member(name: str, role: str) -> bool:
    if _TITLE_NOISE_RE.search(name) or _TITLE_NOISE_RE.search(role):
        return False
    if len(role) > 60 or len(name) > 60:
        return False
    if role.lower().startswith("and "):
        return False
    name_parts = name.split()
    if len(name_parts) < 2:
        return False
    return True


def extract_charter_roster(charter_text: str) -> list[CharterMember]:
    """Parse member names, roles, and bullet responsibilities from the members/roles section."""
    section = _charter_member_section(charter_text)
    members: list[CharterMember] = []
    current: CharterMember | None = None
    bullets: list[str] = []

    def flush() -> None:
        nonlocal current, bullets
        if current is not None:
            members.append(
                CharterMember(
                    name=current.name,
                    role=current.role,
                    responsibilities=tuple(bullets),
                )
            )
        current = None
        bullets = []

    for raw in section.splitlines():
        line = raw.strip()
        if not line:
            continue

        name_match = _NAME_ROLE_RE.match(line)
        if name_match:
            name = name_match.group(1).strip()
            role = name_match.group(2).strip()
            if _looks_like_member(name, role):
                flush()
                current = CharterMember(name=name, role=role, responsibilities=())
                continue

        if current is not None:
            bullet = _BULLET_RE.match(line)
            if bullet:
                bullets.append(bullet.group(1).strip())

    flush()
    return members


def roster_label(member: CharterMember) -> str:
    return f"{member.name} — {member.role}"


def member_in_report(roster_name: str, report_name: str) -> bool:
    a = roster_name.lower().strip()
    b = report_name.lower().strip()
    if a == b or a in b or b in a:
        return True
    a_first = a.split()[0] if a.split() else a
    b_first = b.split()[0] if b.split() else b
    return a_first == b_first and len(a_first) > 1
