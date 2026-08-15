export type LevelUpTaskStatus = "pending" | "submitted" | "evaluated";

export interface LevelUpTask {
  id: string;
  user_id: string;
  task_text: string;
  activity_id: string | null;
  status: LevelUpTaskStatus;
  created_at: string;
}

export interface LevelUpSubmission {
  id: string;
  task_id: string;
  user_id: string;
  submission_text: string;
  ai_feedback: string | null;
  points_awarded: number | null;
  created_at: string;
}

export interface LevelUpSubmissionWithTask extends LevelUpSubmission {
  level_up_tasks: Pick<LevelUpTask, "id" | "task_text" | "activity_id" | "status"> | null;
}