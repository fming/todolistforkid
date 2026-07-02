"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DURATIONS = [
  10,
  15,
  20,
  25,
  30,
  40,
  45,
  60,
  90,
  120,
];

interface DurationSelectProps {
  value: number;
  onChange: (value: number) => void;
}

export default function DurationSelect({
  value,
  onChange,
}: DurationSelectProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(value) => onChange(Number(value))}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {DURATIONS.map((duration) => (
          <SelectItem
            key={duration}
            value={String(duration)}
          >
            {duration} min
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}