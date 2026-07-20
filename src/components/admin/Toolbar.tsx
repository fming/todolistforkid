"use client";

import { Button } from "@/components/ui/button";
import { formatBeijingTime } from "@/lib/date";
import type { PlanStatus } from "@/types/day-plan";

interface ToolbarProps {
  date: string;
  status: PlanStatus | "empty";
  publishedAt?: string;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onLoadTemplate: () => void;
  onSaveAsTemplate: () => void;
  onCopyLastTime: () => void;
}

const STATUS_STYLES: Record<
  ToolbarProps["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  published: {
    label: "Published",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  empty: {
    label: "New",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

export default function Toolbar({
  date,
  status,
  publishedAt,
  onSave,
  onPublish,
  onUnpublish,
  onLoadTemplate,
  onSaveAsTemplate,
  onCopyLastTime,
}: ToolbarProps) {
  const badge = STATUS_STYLES[status];
  const isPublished = status === "published";

  return (
    <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">📅 Today Plan</h2>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-medium ring-1 ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Beijing Time: {date}
            {isPublished && publishedAt && (
              <span className="ml-2 text-slate-400">
                · published {formatBeijingTime(publishedAt)}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onCopyLastTime}>
            Copy Last Time
          </Button>
          <Button variant="outline" onClick={onLoadTemplate}>
            Load Template
          </Button>
          <Button variant="outline" onClick={onSaveAsTemplate}>
            Save as Template
          </Button>
          <Button variant="outline" onClick={onSave}>
            Save Draft
          </Button>
          {isPublished ? (
            <Button
              onClick={onUnpublish}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Unpublish
            </Button>
          ) : (
            <Button
              onClick={onPublish}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
        💡 Save keeps it as a draft. Publish makes it visible to the kid view.
      </p>
    </div>
  );
}
