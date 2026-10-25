import json
from typing import Any

from openai import APIError, OpenAI
from pydantic import ValidationError

from app.charter_roster import (
    CharterMember,
    extract_charter_roster,
    member_in_report,
    roster_label,
)
from app.env_loader import get_openai_api_key, get_openai_model
from app.models import AnalysisReport, MemberReport

SYSTEM_PROMPT = """You are an expert team facilitator. You evaluate ONE meeting against a written team charter.

## Goal
For every person named in the charter, score each of their listed responsibilities and show whether the meeting reflected what the team agreed to.

## Evidence (strict)
- Use ONLY the meeting transcript. Do not invent quotes, attendance, or actions.
- Each evidence item must be a short excerpt from the transcript (trim filler; keep the speaker's wording).
- If a duty does not appear in this meeting, score it low and say there was no evidence—do not assume work happened off-call.
- Match names flexibly: transcripts often use first names ("Jordan") while the charter uses full names ("Jordan Lee").

## Scoring rubric (each responsibility, 0–100)
- 0–20: No meaningful evidence; person silent or duty not shown.
- 21–50: Brief mention or intent only; little or no follow-through in the meeting.
- 51–75: Clear partial fulfillment; one solid example or incomplete execution.
- 76–100: Strong fulfillment; multiple concrete behaviors aligned with the duty.

Listening, facilitating, unblocking, and documenting count when the charter assigns them.

## Per-person overall_score
Average of that person's responsibility scores (all duties weighted equally). One decimal place. Do not inflate scores to be nice.

## Completeness (non-negotiable)
- If "Required roster" appears below, members[] must have exactly one entry per roster person—no skipping anyone.
- Each member's responsibilities[] must include one score per charter bullet for that person (same wording as the charter when possible).
- charter_roles_extracted: every charter member as "Full Name — Role".

## Written sections
- team_summary: 2–4 sentences on what the meeting accomplished and overall charter alignment.
- gaps_and_recommendations: 3–5 specific, actionable improvements for the next sync (agendas, notes, silent members, overdue tasks, etc.)."""

USER_TEMPLATE = """## Team charter

{charter}

## Meeting transcript

{transcript}
{roster_block}
## Deliverable
Return a full AnalysisReport JSON object.

Before you finish, verify:
- Every person in Required roster (if present) has a members[] entry.
- Every charter bullet duty for each person has a responsibility score.
- Quotes in evidence[] actually appear in the transcript."""

ROSTER_BLOCK_TEMPLATE = """
## Required roster
Include every person below in members[] (one MemberReport each, in this order).

{entries}
"""

MEMBER_SYSTEM_PROMPT = """You score ONE charter member for ONE meeting using the same rules as the full team report:
transcript-only evidence, short real quotes, 0–100 rubric per responsibility, honest low scores when silent.
Include every listed responsibility for this person. overall_score = average of responsibility scores."""

MEMBER_USER_TEMPLATE = """## Team charter

{charter}

## Meeting transcript

{transcript}

## Member to score (only this person)

Name: {name}
Role: {role}

Charter responsibilities (score each one):
{responsibilities}

Return one MemberReport for {name}. Match first names in the transcript to this member when needed."""


def _client() -> OpenAI:
    api_key = get_openai_api_key()
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. In charter-check/.env use: OPENAI_API_KEY=sk-… "
            "(or paste your sk-… key alone on line 1). Restart ./scripts/run-prototype.sh after saving."
        )
    return OpenAI(api_key=api_key)


def _roster_block(roster: list[CharterMember]) -> str:
    if not roster:
        return ""
    entries = "\n".join(
        f"- {roster_label(m)}"
        + (
            "\n  Responsibilities:\n"
            + "\n".join(f"    • {r}" for r in m.responsibilities)
            if m.responsibilities
            else ""
        )
        for m in roster
    )
    return ROSTER_BLOCK_TEMPLATE.format(entries=entries)


def _missing_roster_members(
    roster: list[CharterMember], report: AnalysisReport
) -> list[CharterMember]:
    missing: list[CharterMember] = []
    for person in roster:
        if not any(member_in_report(person.name, m.name) for m in report.members):
            missing.append(person)
    return missing


def _order_members_by_roster(
    roster: list[CharterMember], members: list[MemberReport]
) -> list[MemberReport]:
    if not roster:
        return members
    ordered: list[MemberReport] = []
    used: set[int] = set()
    for person in roster:
        for i, m in enumerate(members):
            if i in used:
                continue
            if member_in_report(person.name, m.name):
                ordered.append(m)
                used.add(i)
                break
    for i, m in enumerate(members):
        if i not in used:
            ordered.append(m)
    return ordered


def _analyze_single_member(
    client: OpenAI,
    model: str,
    charter_text: str,
    transcript_text: str,
    person: CharterMember,
) -> MemberReport | None:
    resp_lines = "\n".join(f"- {r}" for r in person.responsibilities) or "- (see charter)"
    user_content = MEMBER_USER_TEMPLATE.format(
        charter=charter_text[:120_000],
        transcript=transcript_text[:120_000],
        name=person.name,
        role=person.role,
        responsibilities=resp_lines,
    )
    messages = [
        {"role": "system", "content": MEMBER_SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    try:
        completion = client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            response_format=MemberReport,
            temperature=0.2,
        )
        return completion.choices[0].message.parsed
    except (APIError, ValidationError, AttributeError):
        return None


def _complete_member_coverage(
    client: OpenAI,
    model: str,
    charter_text: str,
    transcript_text: str,
    report: AnalysisReport,
    roster: list[CharterMember],
) -> AnalysisReport:
    if not roster:
        return report

    labels = [roster_label(m) for m in roster]
    if not report.charter_roles_extracted or len(report.charter_roles_extracted) < len(roster):
        report = report.model_copy(update={"charter_roles_extracted": labels})

    missing = _missing_roster_members(roster, report)
    members = list(report.members)
    for person in missing:
        scored = _analyze_single_member(client, model, charter_text, transcript_text, person)
        if scored is not None:
            members.append(scored)

    members = _order_members_by_roster(roster, members)
    return report.model_copy(update={"members": members})


def analyze_charter_vs_transcript(charter_text: str, transcript_text: str) -> AnalysisReport:
    model = get_openai_model()
    client = _client()

    charter_chunk = charter_text[:120_000]
    transcript_chunk = transcript_text[:120_000]
    roster = extract_charter_roster(charter_chunk)
    user_content = USER_TEMPLATE.format(
        charter=charter_chunk,
        transcript=transcript_chunk,
        roster_block=_roster_block(roster),
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    report: AnalysisReport | None = None
    try:
        completion = client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            response_format=AnalysisReport,
            temperature=0.2,
        )
        report = completion.choices[0].message.parsed
    except (APIError, ValidationError, AttributeError):
        report = None

    if report is None:
        report = _analyze_json_fallback(client, model, messages)

    return _complete_member_coverage(client, model, charter_chunk, transcript_chunk, report, roster)


def _analyze_json_fallback(client: OpenAI, model: str, messages: list[dict[str, str]]) -> AnalysisReport:
    schema = AnalysisReport.model_json_schema()
    response = client.chat.completions.create(
        model=model,
        messages=messages
        + [
            {
                "role": "user",
                "content": "Respond with a single JSON object matching this JSON Schema:\n"
                + json.dumps(schema),
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    raw = response.choices[0].message.content or "{}"
    data: dict[str, Any] = json.loads(raw)
    return AnalysisReport.model_validate(data)
