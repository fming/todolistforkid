"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { CATEGORY_EMOJI, VERIFY_TAGS } from "@/lib/constants";
import { formatBeijingTime } from "@/lib/date";
import type { DayPlan } from "@/types/day-plan";
import type { Task } from "@/types/task";

interface PendingReviewListProps {
  plan: DayPlan;
  onDecided: (updatedPlan: DayPlan) => void;
  onError: (message: string) => void;
}

/** Show the panel of tasks the kid has submitted, awaiting parent review. */
export default function PendingReviewList({
  plan,
  onDecided,
  onError,
}: PendingReviewListProps) {
  const pending = useMemo(
    () => plan.tasks.filter((t) => t.status === "pending"),
    [plan.tasks]
  );

  if (pending.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-amber-900">
        🔔 有 {pending.length} 个任务等待你检查
      </h2>
      <p className="mb-4 text-sm text-amber-800/80">
        Review each submission and either approve or send back with feedback.
      </p>
      <div className="space-y-4">
        {pending.map((task) => (
          <PendingCard
            key={task.id}
            task={task}
            date={plan.date}
            onDecided={onDecided}
            onError={onError}
          />
        ))}
      </div>
    </section>
  );
}

interface PendingCardProps {
  task: Task;
  date: string;
  onDecided: (updatedPlan: DayPlan) => void;
  onError: (message: string) => void;
}

function PendingCard({ task, date, onDecided, onError }: PendingCardProps) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const appendTag = (tag: string) => {
    setComment((prev) => (prev ? `${prev.trim()} ${tag}` : tag));
  };

  const decide = async (decision: "approve" | "reject") => {
    setBusy(true);
    try {
      const res = await fetch("/api/plan/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          id: task.id,
          decision,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as DayPlan;
      setComment("");
      onDecided(updated);
    } catch {
      onError("Verify failed — please retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span aria-hidden>{CATEGORY_EMOJI[task.category]}</span>
            {task.title || "Untitled task"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {task.category} · {task.type} · {task.durationMinutes} min ·{" "}
            {"⭐".repeat(task.difficulty)}
            {task.submittedAt && (
              <>
                {" "}
                · submitted {formatBeijingTime(task.submittedAt)}
              </>
            )}
          </p>
          {task.note && (
            <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p className="mb-1 font-medium text-slate-500">Details</p>
              <article className="prose prose-sm max-w-none prose-p:my-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {task.note}
                </ReactMarkdown>
              </article>
            </div>
          )}
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {VERIFY_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => appendTag(tag)}
            disabled={busy}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 disabled:opacity-50"
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="评语支持 Markdown：**加粗**、- 列表、[链接](url)..."
          rows={3}
          disabled={busy}
          spellCheck={false}
          className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
        />
        <article className="prose prose-sm max-w-none rounded-md border bg-slate-50 px-3 py-2 prose-p:my-1">
          {comment.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {comment}
            </ReactMarkdown>
          ) : (
            <p className="italic text-slate-400">预览会显示在这里…</p>
          )}
        </article>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => decide("reject")}
        >
          ↩ Send back
        </Button>
        <Button
          disabled={busy}
          onClick={() => decide("approve")}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          ✅ Approve
        </Button>
      </div>
    </div>
  );
}
