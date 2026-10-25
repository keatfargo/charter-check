export interface ResponsibilityEvidence {
  quote: string;
  assessment: string;
}

export interface ResponsibilityScore {
  responsibility: string;
  score: number;
  summary: string;
  evidence: ResponsibilityEvidence[];
}

export interface MemberReport {
  name: string;
  role?: string | null;
  overall_score: number;
  responsibilities: ResponsibilityScore[];
}

export interface AnalysisReport {
  team_summary: string;
  charter_roles_extracted: string[];
  members: MemberReport[];
  gaps_and_recommendations: string[];
}
