"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { TaskType } from "@/types/task";
import { TASK_TYPES } from "@/types/task";

interface TaskTypeSelectProps {
  value: TaskType;
  onChange: (value: TaskType) => void;
}

const TYPE_META: Record<
  TaskType,
  { label: string; icon: string }
> = {
  Reading: { label: "Reading", icon: "📚" },
  Writing: { label: "Writing", icon: "✍️" },
  Worksheet: { label: "Worksheet", icon: "📄" },
  Exercise: { label: "Exercise", icon: "🏃" },
  Practice: { label: "Practice", icon: "🔁" },
  Project: { label: "Project", icon: "🧩" },
  Video: { label: "Video", icon: "🎥" },
  Quiz: { label: "Quiz", icon: "❓" },
  Review: { label: "Review", icon: "🔍" },
  Other: { label: "Other", icon: "📦" },
};

export default function TaskTypeSelect({
  value,
  onChange,
}: TaskTypeSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as TaskType)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {TASK_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            <span className="flex items-center gap-2">
              <span>{TYPE_META[type].icon}</span>
              <span>{TYPE_META[type].label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}