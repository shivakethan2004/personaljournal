import type { ProblemPattern } from "@/types/domain";

// Pattern ids match the seed data in
// supabase/migrations/0002_seed_patterns_and_metrics.sql
export const PATTERN_ID = {
  immediateReward: "11111111-0000-0000-0000-000000000001",
  strategySwitching: "11111111-0000-0000-0000-000000000002",
  outcomeAttachment: "11111111-0000-0000-0000-000000000003",
  uncertaintySpiraling: "11111111-0000-0000-0000-000000000004",
  overanalysis: "11111111-0000-0000-0000-000000000005",
  fearOfSelfEval: "11111111-0000-0000-0000-000000000006",
  outcomeBasedConfidence: "11111111-0000-0000-0000-000000000007",
  effortAsInefficiency: "11111111-0000-0000-0000-000000000008",
  planningAsSubstitute: "11111111-0000-0000-0000-000000000009",
  futureLoad: "11111111-0000-0000-0000-000000000010",
  boringMiddle: "11111111-0000-0000-0000-000000000011",
  controllingUncontrollable: "11111111-0000-0000-0000-000000000012",
} as const;

export type QuizQuestion = {
  id: string;
  prompt: string;
  patternIds: string[];
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt:
      "You've been at something for two weeks with no visible payoff yet. Your effort has already quietly dropped, even though you know rationally that nothing's actually wrong.",
    patternIds: [PATTERN_ID.immediateReward],
  },
  {
    id: "q2",
    prompt:
      "Right when a task gets genuinely hard, a new approach starts to look a lot more appealing than pushing through the current one.",
    patternIds: [PATTERN_ID.strategySwitching, PATTERN_ID.boringMiddle],
  },
  {
    id: "q3",
    prompt:
      "A single good result makes you feel like you've 'figured it out,' and a single bad one makes you feel like you haven't — regardless of what you actually did differently.",
    patternIds: [PATTERN_ID.outcomeAttachment],
  },
  {
    id: "q4",
    prompt:
      "Not knowing how something is going to turn out sends you looking for more information or reassurance, instead of just moving forward.",
    patternIds: [PATTERN_ID.uncertaintySpiraling],
  },
  {
    id: "q5",
    prompt:
      "Someone says 'I'm busy' and your mind immediately generates five reasons your whole approach might be wrong.",
    patternIds: [PATTERN_ID.overanalysis],
  },
  {
    id: "q6",
    prompt:
      "Looking honestly at how something actually went feels uncomfortable enough that you'd rather skip it or rush through it.",
    patternIds: [PATTERN_ID.fearOfSelfEval],
  },
  {
    id: "q7",
    prompt:
      "After a setback, it takes you noticeably longer than it 'should' to get back to normal effort — the bad result seems to prove something about you, not just about that one attempt.",
    patternIds: [PATTERN_ID.outcomeBasedConfidence],
  },
  {
    id: "q8",
    prompt:
      "When something takes real, sustained effort, part of you reads that as a sign you're doing it wrong rather than just a normal cost of the work.",
    patternIds: [PATTERN_ID.effortAsInefficiency],
  },
  {
    id: "q9",
    prompt:
      "You've refined the plan again. And again. The actual first step keeps slipping a little further out each time.",
    patternIds: [PATTERN_ID.planningAsSubstitute],
  },
  {
    id: "q10",
    prompt:
      "Thinking about everything still left to do makes it harder to focus on the one small thing in front of you right now.",
    patternIds: [PATTERN_ID.futureLoad],
  },
  {
    id: "q11",
    prompt:
      "The exciting start and the eventual payoff both feel fine. It's the long, repetitive middle stretch that quietly drains you.",
    patternIds: [PATTERN_ID.boringMiddle],
  },
  {
    id: "q12",
    prompt:
      "A good chunk of your mental energy goes toward things you can't actually control — someone else's reaction, timing, luck — instead of the parts that are actually yours to work with.",
    patternIds: [PATTERN_ID.controllingUncontrollable],
  },
  {
    id: "q13",
    prompt:
      "You'll try something once, and if it doesn't click immediately, you're already mentally halfway to the next idea.",
    patternIds: [PATTERN_ID.strategySwitching, PATTERN_ID.immediateReward],
  },
  {
    id: "q14",
    prompt:
      "You can describe exactly what happened in a situation, but you also can't help layering on a theory of why — and the theory starts to feel like the fact.",
    patternIds: [PATTERN_ID.overanalysis, PATTERN_ID.uncertaintySpiraling],
  },
];

export function scoreQuiz(
  answers: Record<string, number>,
  patterns: ProblemPattern[]
): { pattern: ProblemPattern; score: number }[] {
  const totals = new Map<string, { sum: number; count: number }>();

  for (const q of QUIZ_QUESTIONS) {
    const answer = answers[q.id];
    if (answer == null) continue;
    for (const pid of q.patternIds) {
      const existing = totals.get(pid) ?? { sum: 0, count: 0 };
      existing.sum += answer;
      existing.count += 1;
      totals.set(pid, existing);
    }
  }

  return patterns
    .map((pattern) => {
      const t = totals.get(pattern.id);
      return { pattern, score: t ? t.sum / t.count : 0 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}