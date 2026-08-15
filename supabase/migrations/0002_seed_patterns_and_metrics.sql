-- 0002_seed_patterns_and_metrics.sql
-- Seeds the shared, public read-only library tables. Run once.
-- Patterns are psychological, not tied to any specific activity —
-- no row here should mention cold calling, gym, etc.

insert into problem_patterns (id, name, description) values
  ('11111111-0000-0000-0000-000000000001', 'Immediate-reward dependence',
   'You stay motivated only when results show up fast. When payoff is delayed or invisible, effort quietly drops off, even though nothing about the work itself changed.'),
  ('11111111-0000-0000-0000-000000000002', 'Novelty/strategy switching',
   'A new approach feels more promising than sticking with the current one, especially right when the current one gets hard. Switching becomes a way to feel productive without confronting whether the original approach was actually working.'),
  ('11111111-0000-0000-0000-000000000003', 'Outcome attachment',
   'Your mood and sense of progress ride entirely on the result of a single attempt. A good outcome feels like proof you are on track; a bad one feels like proof you are not, regardless of what the process actually looked like.'),
  ('11111111-0000-0000-0000-000000000004', 'Uncertainty spiraling',
   'Not knowing how something will turn out triggers a search for more information or reassurance rather than action. The uncertainty itself becomes the focus, and it can expand well past what the situation actually calls for.'),
  ('11111111-0000-0000-0000-000000000005', 'Overanalysis instead of observation',
   'Rather than simply noticing what happened, you build explanations for why it happened, often several competing ones. The story-building can substitute for actually collecting more data points before drawing conclusions.'),
  ('11111111-0000-0000-0000-000000000006', 'Fear of self-evaluation',
   'Looking honestly at your own performance feels threatening, so it gets avoided or rushed through. This blocks the exact feedback loop that would help you improve.'),
  ('11111111-0000-0000-0000-000000000007', 'Outcome-based confidence',
   'Confidence rises and falls with the last result rather than staying anchored to effort or process. A setback can knock you out of action for far longer than the setback itself would justify.'),
  ('11111111-0000-0000-0000-000000000008', 'Confusing effort with inefficiency',
   'When something takes real, sustained effort, it can start to feel like a sign you are doing it wrong, rather than a normal cost of the work. This can push you toward abandoning approaches that were actually fine.'),
  ('11111111-0000-0000-0000-000000000009', 'Planning as substitute for execution',
   'Refining the plan feels productive and safe, so it keeps expanding, while the actual doing keeps getting pushed slightly further out. More planning quietly becomes a way to delay contact with the real, unpredictable work.'),
  ('11111111-0000-0000-0000-000000000010', 'Future-load',
   'Attention keeps drifting to everything left to do rather than the single next step in front of you. The weight of the whole remaining process makes it harder to start or stay with the current piece of it.'),
  ('11111111-0000-0000-0000-000000000011', 'Difficulty tolerating the boring middle',
   'The early excitement and the eventual payoff both feel manageable, but the long, repetitive stretch in between does not. That stretch is where most real progress actually happens, and it is also where motivation is most likely to quietly leak out.'),
  ('11111111-0000-0000-0000-000000000012', 'Trying to control uncontrollable variables',
   'Energy goes into managing things that were never within your control — other people''s reactions, timing, luck — instead of the parts of the process you actually can influence. This usually leaves less attention for the controllable parts.')
;

insert into metrics_library (id, name, description, why_it_helps, input_type, problem_pattern_id) values
  ('22222222-0000-0000-0000-000000000001', 'Delay tolerance tally',
   'A tap each time you notice yourself wanting to quit or check results early, but you hold off anyway.',
   'Makes visible how often you push through the urge for an immediate payoff, so the pattern stops feeling constant and starts feeling countable.',
   'tally', '11111111-0000-0000-0000-000000000001'),

  ('22222222-0000-0000-0000-000000000002', 'Strategy switch log',
   'A quick tap logged every time you change approach mid-task, with an optional one-line reason.',
   'Surfaces how often switching happens and whether it clusters around difficulty spikes, which is the pattern worth interrupting.',
   'tally', '11111111-0000-0000-0000-000000000002'),

  ('22222222-0000-0000-0000-000000000003', 'Outcome-dependent mood check',
   'A quick 1-5 rating of how much your mood right now is riding on a specific outcome versus the process itself.',
   'Separates how you feel about your effort from how you feel about the result, so the two stop getting silently merged.',
   'number', '11111111-0000-0000-0000-000000000003'),

  ('22222222-0000-0000-0000-000000000004', 'Uncertainty episode tally',
   'A tap each time you notice yourself seeking reassurance or extra information instead of just proceeding.',
   'Turns a vague sense of "I do this a lot" into an actual count, which is the first step to noticing it earlier.',
   'tally', '11111111-0000-0000-0000-000000000004'),

  ('22222222-0000-0000-0000-000000000005', 'Facts vs speculation ratio',
   'A short freeform note on what actually happened versus what you are guessing or assuming about why.',
   'Weekly AI review separates observed fact from story-building, showing how much of your account of events is actually speculation.',
   'text', '11111111-0000-0000-0000-000000000005'),

  ('22222222-0000-0000-0000-000000000006', 'Self-review avoidance tally',
   'A tap whenever you catch yourself putting off, rushing, or skipping an honest look at how something went.',
   'Names the avoidance directly, which is usually enough to reduce it — most self-evaluation avoidance runs on autopilot.',
   'tally', '11111111-0000-0000-0000-000000000006'),

  ('22222222-0000-0000-0000-000000000007', 'Recovery time',
   'Tap-based: mark a setback the moment it happens, then mark when you are back to it. The gap is measured automatically.',
   'Shows exactly how long a setback actually knocks you out of action, which is almost always shorter than it feels in the moment.',
   'timer', '11111111-0000-0000-0000-000000000007'),

  ('22222222-0000-0000-0000-000000000008', 'Effort vs result note',
   'A short freeform note on what you actually did versus what came of it, logged right after something felt effortful.',
   'Weekly review can show whether hard work is being misread as wasted work, separating the two so real inefficiency stands out from normal difficulty.',
   'text', '11111111-0000-0000-0000-000000000008'),

  ('22222222-0000-0000-0000-000000000009', 'Planning-to-action gap',
   'A timer from when you start planning something to the moment you take the first real action on it.',
   'Makes the length of the planning phase concrete, so it is easier to notice when planning has quietly become the whole activity.',
   'timer', '11111111-0000-0000-0000-000000000009'),

  ('22222222-0000-0000-0000-000000000010', 'Process completion rate',
   'A count of the process steps you completed today out of the steps you set out to do.',
   'Anchors attention to the one step you actually finished instead of the whole remaining workload, which is what future-load distorts.',
   'number', '11111111-0000-0000-0000-000000000010'),

  ('22222222-0000-0000-0000-000000000011', 'Execution despite low motivation',
   'A tap logged whenever you do the work anyway despite not feeling like it, independent of how the attempt turns out.',
   'Directly rewards showing up through the unglamorous middle stretch, rather than only noticing exciting starts or satisfying finishes.',
   'tally', '11111111-0000-0000-0000-000000000011'),

  ('22222222-0000-0000-0000-000000000012', 'Control-focus note',
   'A short freeform note on what you spent energy trying to influence, logged when something feels frustrating or out of your hands.',
   'Weekly review can flag how often that energy went toward things outside your control, so attention can shift back to what is actually yours to work with.',
   'text', '11111111-0000-0000-0000-000000000012')
;
