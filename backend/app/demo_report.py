from app.models import (
    AnalysisReport,
    MemberReport,
    ResponsibilityEvidence,
    ResponsibilityScore,
)

DEMO_REPORT = AnalysisReport(
    team_summary=(
        "The group made progress on milestone 2 scope, API design, and test planning. "
        "Most charter roles were visible in the conversation. Gaps include sending the "
        "agenda 24 hours ahead (not evidenced) and complete meeting notes posted before "
        "the next sync (Sam committed to tonight)."
    ),
    charter_roles_extracted=[
        "Alex Kim — Project Manager",
        "Jordan Lee — Technical Lead",
        "Mia Patel — Research & Requirements",
        "Sam Rivera — Quality & Demo",
    ],
    members=[
        MemberReport(
            name="Alex Kim",
            role="Project Manager",
            overall_score=76,
            responsibilities=[
                ResponsibilityScore(
                    responsibility="Schedules meetings and sends agendas 24 hours in advance",
                    score=45,
                    summary="Facilitated this meeting but no evidence of a pre-sent agenda.",
                    evidence=[
                        ResponsibilityEvidence(
                            quote="Today we need to finalize the milestone 2 scope and assign tasks.",
                            assessment="Alex set topics live rather than referencing a prior agenda.",
                        ),
                    ],
                ),
                ResponsibilityScore(
                    responsibility="Keeps the team on time during meetings",
                    score=70,
                    summary="Used timeboxing; meeting still ran over.",
                    evidence=[
                        ResponsibilityEvidence(
                            quote="Let's timebox OAuth discussion to ten minutes.",
                            assessment="Active time management during the call.",
                        ),
                        ResponsibilityEvidence(
                            quote="We went five minutes over—I'll keep a tighter agenda next week.",
                            assessment="Acknowledged overrun and planned improvement.",
                        ),
                    ],
                ),
                ResponsibilityScore(
                    responsibility="Tracks action items and follows up",
                    score=82,
                    summary="Assigned owners and promised a follow-up list.",
                    evidence=[
                        ResponsibilityEvidence(
                            quote="I'll send the action item list after we hang up.",
                            assessment="Clear commitment to document next steps.",
                        ),
                    ],
                ),
            ],
        ),
        MemberReport(
            name="Jordan Lee",
            role="Technical Lead",
            overall_score=74,
            responsibilities=[
                ResponsibilityScore(
                    responsibility="Owns architecture decisions and documents them",
                    score=78,
                    summary="Presented API direction; auth still in flux.",
                    evidence=[
                        ResponsibilityEvidence(
                            quote="I pushed the OpenAPI draft last night.",
                            assessment="Shared current technical direction with the team.",
                        ),
                    ],
                ),
                ResponsibilityScore(
                    responsibility="Reviews pull requests within 48 hours",
                    score=65,
                    summary="Acknowledged overdue review and committed to same day.",
                    evidence=[
                        ResponsibilityEvidence(
                            quote="I still owe PR review on Sam's branch from Monday. I'll do that today.",
                            assessment="Backlog noted with immediate remediation plan.",
                        ),
                    ],
                ),
            ],
        ),
        MemberReport(
            name="Mia Patel",
            role="Research & Requirements",
            overall_score=84,
            responsibilities=[
                ResponsibilityScore(
                    responsibility="Maintains requirements doc and user stories",
                    score=88,
                    summary="Aligned design with stakeholder input and planned doc update.",
                    evidence=[
                        ResponsibilityEvidence(
                            quote="I'll update the requirements doc after this call and flag the change in Slack.",
                            assessment="Direct ownership of requirements maintenance.",
                        ),
                    ],
                ),
                ResponsibilityScore(
                    responsibility="Summarizes stakeholder feedback for the team",
                    score=80,
                    summary="Translated email into concrete product rules.",
                    evidence=[
                        ResponsibilityEvidence(
                            quote="They want social login optional, not required.",
                            assessment="Clear synthesis of external feedback.",
                        ),
                    ],
                ),
            ],
        ),
        MemberReport(
            name="Sam Rivera",
            role="Quality & Demo",
            overall_score=71,
            responsibilities=[
                ResponsibilityScore(
                    responsibility="Writes test plans for each milestone",
                    score=75,
                    summary="Test plan started; OAuth cases pending requirements.",
                    evidence=[
                        ResponsibilityEvidence(
                            quote="I started a test plan for the login module.",
                            assessment="Progress on quality deliverable.",
                        ),
                    ],
                ),
                ResponsibilityScore(
                    responsibility="Captures meeting notes and posts them",
                    score=68,
                    summary="Committed to posting notes after the call.",
                    evidence=[
                        ResponsibilityEvidence(
                            quote="I'll post notes from this meeting to the drive tonight.",
                            assessment="Notes not yet published during the meeting.",
                        ),
                    ],
                ),
            ],
        ),
    ],
    gaps_and_recommendations=[
        "Share agendas at least 24 hours before syncs so Mia and Sam can prepare requirements and tests.",
        "Close the loop on Jordan's PR review SLA by tracking review dates in the action item list.",
        "Have Sam post notes within 24 hours and link them in Slack so Alex's follow-ups reference one source.",
    ],
)
