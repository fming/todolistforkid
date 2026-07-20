"use client";

import { Check, Clock, Undo2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";

export type KidAction = "submit" | "cancel";

interface KidTaskCardProps {
  task: Task;
  onAction: (id: string, action: KidAction) => void | Promise<void>;
}

function resolveStatus(task: Task): TaskStatus {
  return task.status ?? (task.completed ? "verified" : "todo");
}

export default function KidTaskCard({ task, onAction }: KidTaskCardProps) {
  const status = resolveStatus(task);

  const tone =
    status === "verified"
      ? "bg-emerald-50 ring-emerald-400"
      : status === "pending"
        ? "bg-amber-50 ring-amber-400"
        : "bg-white ring-slate-200 hover:ring-slate-300";

  return (
    <Card className={cn("transition ring-1", tone)}>
      <CardHeader>
        <CardTitle className="flex items-start gap-3">
          <span className="text-3xl leading-none" aria-hidden>
            {CATEGORY_EMOJI[task.category]}
          </span>
          <span
            className={cn(
              "text-xl font-bold",
              status === "verified"
                ? "text-slate-400 line-through"
                : "text-slate-900"
            )}
          >
            {task.title || "Untitled task"}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          ⏱ {task.durationMinutes} min
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-yellow-800">
          {"⭐".repeat(task.difficulty)}
        </span>
        {task.required && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-red-800">
            Required
          </span>
        )}
        {task.note && (
          <p className="mt-2 w-full whitespace-pre-line text-slate-500">
            {task.note}
          </p>
        )}
        {task.adminComment && (
          <div
            className={cn(
              "mt-2 w-full rounded-lg px-3 py-2 text-sm",
              status === "verified"
                ? "bg-emerald-100 text-emerald-900"
                : "bg-rose-50 text-rose-900 ring-1 ring-rose-200"
            )}
          >
            <span className="mr-1 font-medium">
              {status === "verified" ? "👨‍👩‍👧 家长评语:" : "↩ 需要重做:"}
            </span>
            {task.adminComment}
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-3">
        {status === "todo" && (
          <>
            <span className="text-sm text-slate-500">
              Tap the circle when you finish
            </span>
            <button
              type="button"
              aria-label="Mark as done"
              onClick={() => onAction(task.id, "submit")}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 ring-2 ring-slate-300 transition hover:text-emerald-500 hover:ring-emerald-400"
            >
              <Check className="h-8 w-8 opacity-40" />
            </button>
          </>
        )}

        {status === "pending" && (
          <>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-800">
              <Clock className="h-4 w-4" />
              等待检查... waiting for parent
            </span>
            <button
              type="button"
              aria-label="Undo submission"
              onClick={() => onAction(task.id, "cancel")}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-amber-600 ring-2 ring-amber-300 transition hover:bg-amber-50 hover:ring-amber-500"
            >
              <Undo2 className="h-7 w-7" />
            </button>
          </>
        )}

        {status === "verified" && (
          <>
            <span className="text-sm font-medium text-emerald-700">
              ✅ 已通过 verified
            </span>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-emerald-600">
              <Check className="h-8 w-8" />
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
