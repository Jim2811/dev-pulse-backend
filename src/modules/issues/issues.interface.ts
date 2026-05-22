export interface IIssue {
  id?: number;
  title: string;
  description: string;
  status?: "open" | "in_progress" | "closed";
  type: string;
  reporter_id: number;
  created_at?: Date;
}

export interface IUpdateIssue{
  title?: string;
  description?: string;
  type?: "bug" | "feature_request"
}