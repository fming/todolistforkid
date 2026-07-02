"use client";

import { Check } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

interface KidTaskCardProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void | Promise<void>;
}

export default function KidTaskCard({ task, onToggle }: KidTaskCardProps) {
  const done = task.completed;

  return (
    <Card
      className={cn(
        "transition ring-1",
        done
          ? "bg-emerald-50 ring-emerald-400"
          : "bg-white ring-slate-200 hover:ring-slate-300"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-start gap-3">
          <span className="text-3xl leading-none" aria-hidden>
            {CATEGORY_EMOJI[task.category]}
          </span>
          <span
            className={cn(
              "text-xl font-bold",
              done ? "text-slate-400 line-through" : "text-slate-900"
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
          <p className="mt-2 w-full text-slate-500">{task.note}</p>
        )}
      </CardContent>

      <CardFooter className="justify-between">
        <span className={cn("text-sm", done ? "text-emerald-700" : "text-slate-500")}>
          {done ? "✅ Done!" : "Tap the circle when you finish"}
        </span>
        <button
          type="button"
          aria-label={done ? "Mark as not done" : "Mark as done"}
          aria-pressed={done}
          onClick={() => onToggle(task.id, !done)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full ring-2 transition",
            done
              ? "bg-emerald-500 text-white ring-emerald-600 hover:bg-emerald-600"
              : "bg-white text-slate-400 ring-slate-300 hover:ring-emerald-400 hover:text-emerald-500"
          )}
        >
          <Check className={cn("h-8 w-8", done ? "opacity-100" : "opacity-40")} />
        </button>
      </CardFooter>
    </Card>
  );
}
