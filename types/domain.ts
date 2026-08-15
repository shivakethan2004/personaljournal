export type InputType = "number" | "text" | "timer" | "tally";

export type ProblemPattern = {
  id: string;
  name: string;
  description: string;
};

export type LibraryMetric = {
  id: string;
  name: string;
  description: string;
  why_it_helps: string;
  input_type: InputType;
  problem_pattern_id: string | null;
};

export type CustomMetricDraft = {
  name: string;
  description: string;
  input_type: InputType;
};

export type ActivityDraft = {
  name: string;
  description: string;
};

export type QuizAnswer = {
  question_id: string;
  score: number; // 1-5
};