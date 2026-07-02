"use client";

import { useCallback, useEffect, useState } from "react";

import Toolbar, { type TemplateKey } from "@/components/admin/Toolbar";
import TaskList from "@/components/admin/TaskList";

import { DEFAULT_TASK } from "@/lib/constants";
import type { DayPlan, PlanStatus } from "@/types/day-plan";
import type { Task } from "@/types/task";

type BannerKind = "info" | "success" | "error";
interface Banner {
  kind: BannerKind;
  message: string;
}

const BANNER_STYLES: Record<BannerKind, string> = {
  info: "bg-slate-100 text-slate-800 ring-slate-200",
  success: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  error: "bg-red-100 text-red-800 ring-red-200",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyPlan(date: string): DayPlan {
  return {
    date,
    status: "draft",
    tasks: [],
    updatedAt: new Date().toISOString(),
  };
}

export default function AdminPage() {
  const [date] = useState(todayIso);
  const [plan, setPlan] = useState<DayPlan>(() => emptyPlan(date));
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<Banner | null>(null);

  const notify = useCallback((kind: BannerKind, message: string) => {
    setBanner({ kind, message });
  }, []);

  const loadPlan = useCallback(async (target: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plan?date=${target}&draft=1`);
      const data = (await res.json()) as
        | DayPlan
        | { date: string; status: "empty"; tasks: Task[] };

      if ("status" in data && data.status === "empty") {
        setPlan(emptyPlan(target));
      } else {
        setPlan(data as DayPlan);
      }
    } catch {
      notify("error", "Failed to load plan.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadPlan(date);
  }, [date, loadPlan]);

  async function handleSave() {
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...plan, status: "draft" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = (await res.json()) as DayPlan;
      setPlan(saved);
      notify("success", "Draft saved.");
    } catch {
      notify("error", "Save failed.");
    }
  }

  async function handlePublish() {
    try {
      // Save first so latest edits are captured before publishing.
      const saveRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (!saveRes.ok) throw new Error("save failed");

      const pubRes = await fetch("/api/plan/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: plan.date }),
      });
      if (!pubRes.ok) throw new Error("publish failed");

      const saved = (await pubRes.json()) as DayPlan;
      setPlan(saved);
      notify("success", "Plan published — kids can see it now.");
    } catch {
      notify("error", "Publish failed.");
    }
  }

  async function handleUnpublish() {
    try {
      const res = await fetch("/api/plan/publish", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: plan.date }),
      });
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as DayPlan;
      setPlan(saved);
      notify("info", "Plan reverted to draft.");
    } catch {
      notify("error", "Unpublish failed.");
    }
  }

  async function handleLoadTemplate(name: TemplateKey) {
    try {
      const res = await fetch(`/api/templates?name=${name}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { name: string; tasks: Task[] };
      setPlan((prev) => ({ ...prev, status: "draft", tasks: data.tasks }));
      notify("info", `Loaded template "${data.name}". Remember to save.`);
    } catch {
      notify("error", "Failed to load template.");
    }
  }

  async function handleCopyYesterday() {
    const d = new Date(`${plan.date}T00:00:00`);
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);

    try {
      const res = await fetch(`/api/plan?date=${yesterday}&draft=1`);
      const data = (await res.json()) as
        | DayPlan
        | { date: string; status: "empty"; tasks: Task[] };

      if (!("tasks" in data) || data.tasks.length === 0) {
        notify("info", "No plan for yesterday to copy.");
        return;
      }

      const cloned: Task[] = data.tasks.map((t) => ({
        ...t,
        id: crypto.randomUUID(),
        completed: false,
      }));
      setPlan((prev) => ({ ...prev, status: "draft", tasks: cloned }));
      notify("info", `Copied ${cloned.length} tasks from ${yesterday}.`);
    } catch {
      notify("error", "Copy Yesterday failed.");
    }
  }

  function updateTask<K extends keyof Task>(id: string, field: K, value: Task[K]) {
    setPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  }

  function addTask() {
    setPlan((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { id: crypto.randomUUID(), ...DEFAULT_TASK }],
    }));
  }

  function deleteTask(id: string) {
    setPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }

  const status: PlanStatus | "empty" =
    plan.tasks.length === 0 && plan.updatedAt === new Date(0).toISOString()
      ? "empty"
      : plan.status;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Summer Learning Admin
            </h1>
            <p className="mt-2 text-slate-600">
              Manage daily learning plans. Publish to make them visible to kids.
            </p>
          </div>
          <a
            href="/"
            className="text-sm text-slate-500 underline hover:text-slate-800"
          >
            Kid view →
          </a>
        </div>

        {banner && (
          <div
            className={`mb-4 flex items-start justify-between gap-4 rounded-lg px-4 py-3 text-sm ring-1 ${BANNER_STYLES[banner.kind]}`}
          >
            <span>{banner.message}</span>
            <button
              onClick={() => setBanner(null)}
              className="text-current/70 hover:text-current"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <Toolbar
          date={plan.date}
          status={status}
          publishedAt={plan.publishedAt}
          onSave={handleSave}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onLoadTemplate={handleLoadTemplate}
          onCopyYesterday={handleCopyYesterday}
        />

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading plan...
          </div>
        ) : (
          <TaskList
            tasks={plan.tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}
      </div>
    </main>
  );
}
