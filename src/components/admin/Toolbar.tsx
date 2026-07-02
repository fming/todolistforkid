"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ToolbarProps {
  date: string;
  onSave?: () => void;
  onLoadTemplate?: (template: string) => void;
  onCopyYesterday?: () => void;
}

export default function Toolbar({
  date,
  onSave,
  onLoadTemplate,
  onCopyYesterday,
}: ToolbarProps) {
  const [template, setTemplate] = useState("Summer Weekday");

  return (
    <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            📅 Today Plan
          </h2>

          <p className="text-sm text-slate-500">
            {date}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onCopyYesterday?.()}
          >
            Copy Yesterday
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              onLoadTemplate?.(template)
            }
          >
            Load Template
          </Button>

          <Button onClick={onSave}>
            Save Plan
          </Button>
        </div>
      </div>

      {/* Template selector */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-600">
            Template
          </label>

          <select
            className="w-full rounded-lg border px-3 py-2"
            value={template}
            onChange={(e) =>
              setTemplate(e.target.value)
            }
          >
            <option value="Summer Weekday">
              Summer Weekday
            </option>

            <option value="Summer Weekend">
              Summer Weekend
            </option>

            <option value="School Day">
              School Day
            </option>
          </select>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
          💡 Tip: Templates help you generate daily plans in 1 click
        </div>
      </div>
    </div>
  );
}