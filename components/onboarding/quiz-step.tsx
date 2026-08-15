"use client";

import { QUIZ_QUESTIONS } from "@/lib/onboarding/quiz-data";

const SCORE_LABELS = ["Not me", "A little", "Sometimes", "Often", "Very me"];

export function QuizStep({
  answers,
  onAnswer,
  onNext,
}: {
  answers: Record<string, number>;
  onAnswer: (questionId: string, score: number) => void;
  onNext: () => void;
}) {
  const answeredCount = Object.keys(answers).length;
  const canContinue = answeredCount === QUIZ_QUESTIONS.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-lg font-semibold">
          How much does each of these resonate?
        </h2>
        <p className="text-muted-foreground text-sm">
          No right answers — just rate how close each one lands.
        </p>
      </div>

      <ol className="space-y-6">
        {QUIZ_QUESTIONS.map((q, i) => (
          <li key={q.id} className="space-y-2">
            <p className="text-sm leading-relaxed">
              <span className="text-muted-foreground">{i + 1}. </span>
              {q.prompt}
            </p>
            <div className="flex gap-1.5">
              {SCORE_LABELS.map((label, idx) => {
                const value = idx + 1;
                const selected = answers[q.id] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onAnswer(q.id, value)}
                    title={label}
                    className={`flex-1 rounded-md border px-2 py-2 text-xs transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-muted-foreground text-xs">
          {answeredCount} / {QUIZ_QUESTIONS.length} answered
        </span>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          See my results
        </button>
      </div>
    </div>
  );
}