"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { TaskDifficulty } from "@/types/task";
import { TASK_DIFFICULTIES } from "@/types/task";

interface DifficultySelectProps {
  value: TaskDifficulty;
  onChange: (value: TaskDifficulty) => void;
}

const DIFFICULTY_META: Record<
  TaskDifficulty,
  { label: string; icon: string; color: string }
> = {
  1: {
    label: "Easy",
    icon: "⭐",
    color: "text-green-600",
  },
  2: {
    label: "Medium",
    icon: "⭐⭐",
    color: "text-yellow-600",
  },
  3: {
    label: "Hard",
    icon: "⭐⭐⭐",
    color: "text-red-600",
  },
};

export default function DifficultySelect({
  value,
  onChange,
}: DifficultySelectProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v) as TaskDifficulty)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {TASK_DIFFICULTIES.map((level) => (
          <SelectItem key={level} value={String(level)}>
            <span className="flex items-center gap-2">
              <span>{DIFFICULTY_META[level].icon}</span>
              <span>{DIFFICULTY_META[level].label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}