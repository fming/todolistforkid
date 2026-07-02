"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Task } from "@/types/task";
import { TASK_CATEGORIES } from "@/lib/constants";

interface TaskRowProps {
  task: Task;
  onChange: <K extends keyof Task>(
    id: string,
    field: K,
    value: Task[K]
  ) => void;
  onDelete: (id: string) => void;
}

export default function TaskRow({
  task,
  onChange,
  onDelete,
}: TaskRowProps) {
  return (
    <tr className="border-b hover:bg-slate-50">
      {/* Task */}
      <td className="p-3">
        <Input
          value={task.title}
          placeholder="Task name..."
          onChange={(e) =>
            onChange(task.id, "title", e.target.value)
          }
        />
      </td>

      {/* Category */}
      <td className="p-3 w-52">
        <Select
          value={task.category}
          onValueChange={(value) =>
            onChange(task.id, "category", value as Task["category"])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {TASK_CATEGORIES.map((category) => (
              <SelectItem
                key={category}
                value={category}
              >
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* Duration */}
      <td className="p-3 w-32">
        <Input
          type="number"
          min={1}
          value={task.durationMinutes}
          onChange={(e) =>
            onChange(
              task.id,
              "durationMinutes",
              Number(e.target.value)
            )
          }
        />
      </td>

      {/* Required */}
      <td className="text-center">
        <Checkbox
          checked={task.required}
          onCheckedChange={(checked) =>
            onChange(
              task.id,
              "required",
              checked === true
            )
          }
        />
      </td>

      {/* Delete */}
      <td className="text-center w-16">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </td>
    </tr>
  );
}