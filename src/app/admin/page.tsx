"use client";

import { useState } from "react";

import Toolbar from "@/components/admin/Toolbar";
import TaskList from "@/components/admin/TaskList";

import type { Task } from "@/types/task";
import { DEFAULT_TASK } from "@/lib/constants";

export default function AdminPage() {
  const today = new Date().toISOString().split("T")[0];

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: crypto.randomUUID(),
      title: "Singapore Math",
      category: "Math",
      durationMinutes: 30,
      required: true,
    },
    {
      id: crypto.randomUUID(),
      title: "RAZ",
      category: "English",
      durationMinutes: 20,
      required: true,
    },
  ]);

  function updateTask<K extends keyof Task>(
    id: string,
    field: K,
    value: Task[K]
  ) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              [field]: value,
            }
          : task
      )
    );
  }

  function addTask() {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...DEFAULT_TASK,
      },
    ]);
  }

  function deleteTask(id: string) {
    setTasks((prev) =>
      prev.filter((task) => task.id !== id)
    );
  }

  function handleSave() {
    console.log(tasks);

    alert("Save will be implemented in the next sprint.");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Summer Learning Admin
          </h1>

          <p className="mt-2 text-slate-600">
            Create and manage today's learning plan.
          </p>
        </div>

        <Toolbar date={today} />

        <TaskList
          tasks={tasks}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Save Today's Plan
          </button>
        </div>
      </div>
    </main>
  );
}