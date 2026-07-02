"use client";

import { Button } from "@/components/ui/button";

interface ToolbarProps {
  date: string;
}

export default function Toolbar({ date }: ToolbarProps) {
  return (
    <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date
          </label>

          <input
            type="date"
            value={date}
            readOnly
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Template
          </label>

          <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2">
            <option>Summer Weekday</option>
            <option>Summer Weekend</option>
            <option>School Day</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline">
          Load Template
        </Button>

        <Button variant="secondary">
          Copy Yesterday
        </Button>

        <Button>
          Save
        </Button>
      </div>
    </div>
  );
}