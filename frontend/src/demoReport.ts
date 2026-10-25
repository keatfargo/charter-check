import type { AnalysisReport } from "./types";

export const DEMO_REPORT: AnalysisReport = {
  team_summary:
    "The group made progress on milestone 2 scope, API design, and test planning. Most charter roles were visible in the conversation. Gaps include sending the agenda 24 hours ahead (not evidenced) and complete meeting notes posted before the next sync (Sam committed to tonight).",
  charter_roles_extracted: [
    "Alex Kim — Project Manager",
    "Jordan Lee — Technical Lead",
    "Mia Patel — Research & Requirements",
    "Sam Rivera — Quality & Demo",
  ],
  members: [
    {
      name: "Mia Patel",
      role: "Research & Requirements",
      overall_score: 84,
      responsibilities: [
        {
          responsibility: "Maintains requirements doc and user stories",
          score: 88,
          summary: "Aligned design with stakeholder input and planned doc update.",
          evidence: [
            {
              quote:
                "I'll update the requirements doc after this call and flag the change in Slack.",
              assessment: "Direct ownership of requirements maintenance.",
            },
          ],
        },
      ],
    },
    {
      name: "Alex Kim",
      role: "Project Manager",
      overall_score: 76,
      responsibilities: [
        {
          responsibility: "Keeps the team on time during meetings",
          score: 70,
          summary: "Used timeboxing; meeting still ran over.",
          evidence: [
            {
              quote: "We went five minutes over—I'll keep a tighter agenda next week.",
              assessment: "Acknowledged overrun and planned improvement.",
            },
          ],
        },
      ],
    },
    {
      name: "Jordan Lee",
      role: "Technical Lead",
      overall_score: 74,
      responsibilities: [
        {
          responsibility: "Reviews pull requests within 48 hours",
          score: 65,
          summary: "Acknowledged overdue review and committed to same day.",
          evidence: [
            {
              quote:
                "I still owe PR review on Sam's branch from Monday. I'll do that today.",
              assessment: "Backlog noted with immediate remediation plan.",
            },
          ],
        },
      ],
    },
    {
      name: "Sam Rivera",
      role: "Quality & Demo",
      overall_score: 71,
      responsibilities: [
        {
          responsibility: "Captures meeting notes and posts them",
          score: 68,
          summary: "Committed to posting notes after the call.",
          evidence: [
            {
              quote: "I'll post notes from this meeting to the drive tonight.",
              assessment: "Notes not yet published during the meeting.",
            },
          ],
        },
      ],
    },
  ],
  gaps_and_recommendations: [
    "Share agendas at least 24 hours before syncs so Mia and Sam can prepare requirements and tests.",
    "Close the loop on Jordan's PR review SLA by tracking review dates in the action item list.",
    "Have Sam post notes within 24 hours and link them in Slack so Alex's follow-ups reference one source.",
  ],
};
