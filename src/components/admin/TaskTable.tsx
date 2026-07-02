"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface Task {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  required: boolean;
}

const CATEGORIES = [
  "Math",
  "English",
  "Chinese",
  "Reading",
  "Sport",
  "Programming",
  "Music",
  "Art",
  "Other",
];

export default function TaskTable() {
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
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function addTask() {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        category: "Math",
        durationMinutes: 30,
        required: true,
      },
    ]);
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Today's Tasks
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Edit today's learning plan.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-sm text-slate-600">
                <th className="px-4 py-3 text-left">Task</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-center">Minutes</th>
                <th className="px-4 py-3 text-center">Required</th>
                <th className="w-16"></th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-t transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <input
                      className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                      value={task.title}
                      placeholder="Task name..."
                      onChange={(e) =>
                        updateTask(task.id, "title", e.target.value)
                      }
                    />
                  </td>

                  <td className="px-4 py-3 w-56">
                    <select
                      className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                      value={task.category}
                      onChange={(e) =>
                        updateTask(task.id, "category", e.target.value)
                      }
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <input
                      className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-sm outline-none transition focus:border-blue-500"
                      type="number"
                      value={task.durationMinutes}
                      onChange={(e) =>
                        updateTask(
                          task.id,
                          "durationMinutes",
                          Number(e.target.value)
                        )
                      }
                    />
                  </td>

                  <td className="text-center">
                    <input
                      className="h-4 w-4 rounded border-slate-300"
                      type="checkbox"
                      checked={task.required}
                      onChange={(e) =>
                        updateTask(task.id, "required", e.target.checked)
                      }
                    />
                  </td>

                  <td className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t p-4">
          <Button onClick={addTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>
    </div>
  );
}