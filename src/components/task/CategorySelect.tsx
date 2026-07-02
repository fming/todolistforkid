"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { TaskCategory } from "@/types/task";

const CATEGORIES: {
  value: TaskCategory;
  label: string;
  icon: string;
}[] = [
  { value: "Math", label: "Math", icon: "📐" },
  { value: "English", label: "English", icon: "📖" },
  { value: "Chinese", label: "Chinese", icon: "🈶" },
  { value: "Reading", label: "Reading", icon: "📚" },
  { value: "Sport", label: "Sport", icon: "⚽" },
  { value: "Programming", label: "Programming", icon: "💻" },
  { value: "Music", label: "Music", icon: "🎹" },
  { value: "Art", label: "Art", icon: "🎨" },
  { value: "Other", label: "Other", icon: "📦" },
];

interface Props {
  value: TaskCategory;
  onChange: (value: TaskCategory) => void;
}

export default function CategorySelect({
  value,
  onChange,
}: Props) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as TaskCategory)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {CATEGORIES.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
          >
            <span className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}