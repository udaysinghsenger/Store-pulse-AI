export type IssueType =
  | "inventory_issue"
  | "staff_issue"
  | "queue_issue"
  | "maintenance_issue"
  | "pricing_issue"
  | "general_experience"
  | "unknown";

export type Sentiment = "positive" | "neutral" | "negative";

export type AIClassification = {
  issue_type: IssueType;
  sentiment: Sentiment;
  product_name?: string;
  color?: string;
  size?: string;
  section?: string;
  store_hint?: string;
  claim_summary: string;
  confidence_score: number;
};

export type VerificationResult = {
  verification_status:
    | "verified"
    | "unverified"
    | "needs_review"
    | "no_action_required";
  confidence_score: number;
  evidence: Record<string, unknown>;
  recommended_action: string;
  priority: "low" | "medium" | "high" | "critical";
  assigned_role: string;
  assigned_to?: string;
  section?: string;
  assignment_reason?: string;
  reassignment_allowed?: boolean;
};