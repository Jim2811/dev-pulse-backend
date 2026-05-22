export interface IIssue {
  id?: number;
  title: string;
  description: string;
  status?: "open" | "in_progress" | "closed";
  type: string;
  reporter_id: number;
  created_at?: Date;
}
