"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import StatusBanner, {
  type BannerKind,
  type BannerState,
} from "@/components/admin/StatusBanner";
import TaskList from "@/components/admin/TaskList";

import { DEFAULT_TASK } from "@/lib/constants";
import type { Task } from "@/types/task";

interface TemplateResponse {
  name: string;
  tasks: Task[];
}

export default function TemplatePage() {
  const [name, setName] = useState("Default Learning Plan");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<BannerState | null>(null);

  const notify = useCallback((kind: BannerKind, message: string) => {
    setBanner({ kind, message });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as TemplateResponse;
      setName(data.name);
      setTasks(data.tasks);
    } catch {
      notify("error", "Failed to load template.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateTask<K extends keyof Task>(
    id: string,
    field: K,
    value: Task[K]
  ) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function addTask() {
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...DEFAULT_TASK },
    ]);
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSave() {
    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tasks }),
      });
      if (!res.ok) throw new Error();
      notify("success", "Template saved.");
    } catch {
      notify("error", "Failed to save template.");
    }
  }

  function handleDiscard() {
    if (!confirm("Discard changes and reload the template from disk?")) return;
    void load();
  }

  return (
    <>
      <StatusBanner banner={banner} onDismiss={() => setBanner(null)} />

      <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              🧩 Default Template
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              This is the base plan loaded when you click{" "}
              <span className="font-medium">Load Template</span> on the Today page.
            </p>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-slate-500">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full max-w-sm rounded-md border px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDiscard}>
              Discard changes
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Template
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
          Loading template...
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      )}
    </>
  );
}
