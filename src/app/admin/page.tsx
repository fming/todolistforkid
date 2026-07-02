"use client";

import { useEffect, useState } from "react";

import Toolbar from "@/components/admin/Toolbar";
import TaskList from "@/components/admin/TaskList";

import type { Task } from "@/types/task";
import { DEFAULT_TASK } from "@/lib/constants";

type DayPlan = {
  date: string;
  tasks: Task[];
};

export default function AdminPage() {
  const today = new Date().toISOString().split("T")[0];

  const [date] = useState(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load from API
   */
  async function loadPlan(targetDate: string) {
    setLoading(true);

    try {
      const res = await fetch(`/api/plan?date=${targetDate}`);
      const data: DayPlan = await res.json();

      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Failed to load plan", err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Save to API
   */
  async function savePlan() {
    try {
      await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          tasks,
        }),
      });

      alert("Saved successfully!");
    } catch (err) {
      console.error("Save failed", err);
    }
  }

  /**
   * Update task
   */
  function updateTask<K extends keyof Task>(
    id: string,
    field: K,
    value: Task[K]
  ) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, [field]: value }
          : task
      )
    );
  }

  /**
   * Add task
   */
  function addTask() {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...DEFAULT_TASK,
      },
    ]);
  }

  /**
   * Delete task
   */
  function deleteTask(id: string) {
    setTasks((prev) =>
      prev.filter((task) => task.id !== id)
    );
  }

  /**
   * Load today on mount
   */
  useEffect(() => {
    loadPlan(date);
  }, [date]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Summer Learning Admin
          </h1>

          <p className="mt-2 text-slate-600">
            Manage daily learning plans with real data.
          </p>
        </div>

        {/* Toolbar */}
        <Toolbar
          date={date}
          onSave={savePlan}
          onLoadTemplate={(template) => {
            console.log("Load template:", template);
          }}
          onCopyYesterday={() => {
            console.log("Copy yesterday not implemented yet");
          }}
        />

        {/* Content */}
        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading plan...
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}
      </div>
    </main>
  );
}