"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
                    <Input
                      value={task.title}
                      placeholder="Task name..."
                      onChange={(e) =>
                        updateTask(task.id, "title", e.target.value)
                      }
                    />
                  </td>

                  <td className="px-4 py-3 w-56">
                    <Select
                      value={task.category}
                      onValueChange={(value) =>
                        updateTask(task.id, "category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="px-4 py-3">
                    <Input
                      className="text-center"
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
                    <Checkbox
                      checked={task.required}
                      onCheckedChange={(checked) =>
                        updateTask(task.id, "required", checked === true)
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