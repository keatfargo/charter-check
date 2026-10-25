from pydantic import BaseModel, Field


class ResponsibilityEvidence(BaseModel):
    quote: str = Field(description="Short excerpt from the transcript")
    assessment: str = Field(description="How this relates to the responsibility")


class ResponsibilityScore(BaseModel):
    responsibility: str = Field(
        description="Wording of one duty from the charter for this person.",
    )
    score: float = Field(ge=0, le=100, description="0-100 adherence for this duty in this meeting.")
    summary: str = Field(description="One or two sentences; state if no evidence appeared.")
    evidence: list[ResponsibilityEvidence] = Field(
        default_factory=list,
        description="Short transcript quotes; empty when there is no evidence.",
    )


class MemberReport(BaseModel):
    name: str = Field(description="Full name as in the charter.")
    role: str | None = Field(default=None, description="Role title from the charter.")
    overall_score: float = Field(
        ge=0,
        le=100,
        description="Average of this member's responsibility scores.",
    )
    responsibilities: list[ResponsibilityScore] = Field(
        default_factory=list,
        description="One entry per charter bullet duty for this person.",
    )


class AnalysisReport(BaseModel):
    team_summary: str = Field(
        description="Brief meeting recap and overall charter alignment.",
    )
    charter_roles_extracted: list[str] = Field(
        default_factory=list,
        description="Every person or role named in the charter, one string per entry.",
    )
    members: list[MemberReport] = Field(
        default_factory=list,
        description="One entry per charter member; must include everyone from the charter.",
    )
    gaps_and_recommendations: list[str] = Field(default_factory=list)
