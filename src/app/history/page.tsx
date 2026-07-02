"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DayPlan } from "@/types/day-plan";

export default function History() {
  const [plans, setPlans] = useState<DayPlan[] | null>(null);

  useEffect(() => {
    fetch("/api/plan/history")
      .then((r) => r.json())
      .then((data: DayPlan[]) => setPlans(data))
      .catch(() => setPlans([]));
  }, []);

  if (plans === null) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <p className="text-slate-500">Loading history...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl p-8">
        <header className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">📅 History</h1>
            <p className="mt-1 text-sm text-slate-500">
              Published plans, newest first.
            </p>
          </div>
          <a
            href="/"
            className="text-sm text-slate-500 underline hover:text-slate-800"
          >
            Today →
          </a>
        </header>

        {plans.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
            No published plans yet.
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const total = plan.tasks.length;
              const done = plan.tasks.filter((t) => t.completed).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <Card key={plan.date}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{plan.date}</span>
                      <span className="text-sm font-normal text-slate-500">
                        {done} / {total} done
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <ul className="space-y-1 text-sm">
                      {plan.tasks.map((task) => (
                        <li key={task.id} className="text-slate-700">
                          {task.completed ? "✅" : "⬜"} {task.title || "Untitled"}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
