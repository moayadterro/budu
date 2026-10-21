"use client";

import { useActionState, useState } from "react";
import type { QuizInfo, QuizKind } from "@/entities/quiz";
import { cn } from "@/shared/lib/cn";
import { Alert } from "@/shared/ui/alert";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Textarea } from "@/shared/ui/textarea";
import { useT } from "@/shared/i18n";
import { fromLocalInput, toLocalInput } from "../lib/time";
import { saveQuizAction, type QuizFormState } from "../server/actions";

const idle: QuizFormState = { status: "idle" };

/**
 * Quiz / exam settings: title, kind, instructions, closing time, time limit, pass mark, and optionally
 * only some classes. When it's published (now or scheduled) is set with the Publish controls. Rendered after a client interaction or with `key`, so local time is fine.
 */
export function QuizSettingsForm({
  courseId,
  quiz,
  classes,
  base,
  examOnly = false,
}: {
  courseId: number;
  quiz?: QuizInfo;
  /** the course's classes (school courses); [] hides the class picker */
  classes: Array<{ id: number; name: string }>;
  /** where the quiz screens live: `/courses/:id/quizzes` or `/school/exams` */
  base: string;
  /** school exams: always an exam (no kind picker) */
  examOnly?: boolean;
}) {
  const t = useT();
  const s = t.quiz.settings;
  const [state, action] = useActionState(saveQuizAction, idle);
  const [kind, setKind] = useState<QuizKind>(
    examOnly ? "exam" : (quiz?.kind ?? "quiz"),
  );
  const [closes, setCloses] = useState(() =>
    toLocalInput(quiz?.closesAt ?? null),
  );
  const [picked, setPicked] = useState<number[]>(quiz?.classIds ?? []);
  const chip = (on: boolean) =>
    cn(
      "rounded-lg border px-3 py-2 text-start text-sm transition-colors",
      on ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
    );

  return (
    // a container: two columns only when the form itself is wide (not in the editor's sidebar)
    <form action={action} className="@container">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="base" value={base} />
      {quiz && <input type="hidden" name="quizId" value={quiz.id} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="closesAt" value={fromLocalInput(closes)} />
      {picked.map((id) => (
        <input key={id} type="hidden" name="classIds" value={id} />
      ))}
      {state.status === "saved" && (
        <Alert key={state.at} variant="success" className="mb-4">
          {s.saved}
        </Alert>
      )}
      {state.status === "error" && (
        <Alert key={state.at} variant="destructive" className="mb-4">
          {s.errors[state.error]}
        </Alert>
      )}

      <Field label={s.name}>
        <Input
          name="name"
          required
          maxLength={200}
          defaultValue={quiz?.name}
          placeholder={s.namePh}
        />
      </Field>

      {!examOnly && (
        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-medium">{s.kind}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["quiz", "exam"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={chip(kind === k)}
              >
                <span className="block font-medium">{t.quiz.kind[k]}</span>
                <span className="block text-xs text-muted-foreground">
                  {s.kindHint[k]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <Field label={s.intro}>
        <Textarea
          name="intro"
          rows={3}
          maxLength={5000}
          defaultValue={quiz?.intro}
          placeholder={s.introPh}
        />
      </Field>

      <div className="grid items-start gap-x-4 @lg:grid-cols-2">
        <Field label={s.closes} hint={s.closesHint}>
          <Input
            type="datetime-local"
            value={closes}
            onChange={(e) => setCloses(e.target.value)}
          />
        </Field>
        <Field label={s.timeLimit} hint={s.timeLimitHint}>
          <Input
            name="timeLimit"
            type="number"
            min={0}
            max={600}
            inputMode="numeric"
            defaultValue={
              quiz?.timeLimit ? Math.round(quiz.timeLimit / 60) : ""
            }
            placeholder="0"
          />
        </Field>
        <Field label={s.passMark} hint={s.passMarkHint}>
          <Input
            name="passMark"
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            defaultValue={quiz?.passMark || ""}
            placeholder="0"
          />
        </Field>
      </div>

      {classes.length > 0 && (
        <fieldset className="mb-4">
          <legend className="mb-1 text-sm font-medium">{s.classes}</legend>
          <p className="mb-2 text-xs text-muted-foreground">{s.classesHint}</p>
          <div className="flex flex-wrap gap-2">
            {classes.map((k) => {
              const on = picked.includes(k.id);
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setPicked((cur) =>
                      on ? cur.filter((x) => x !== k.id) : [...cur, k.id],
                    )
                  }
                  className={cn(
                    "h-9 rounded-md border px-3 text-sm font-medium transition-colors",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {k.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <SubmitButton label={quiz ? s.save : s.create} pendingLabel={s.saving} />
    </form>
  );
}
