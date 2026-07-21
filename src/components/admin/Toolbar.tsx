"use client";

import { Button } from "@/components/ui/button";
import { formatBeijingTime } from "@/lib/date";

export type PlanMode = "published" | "draft";

interface ToolbarProps {
  date: string;
  mode: PlanMode;
  onSelectMode: (mode: PlanMode) => void;

  hasPublished: boolean;
  hasDraft: boolean;
  dirty: boolean;

  publishedAt?: string;
  draftUpdatedAt?: string;

  // draft-mode actions
  onSaveDraft: () => void;
  onPublish: () => void;
  onDiscardDraft: () => void;
  onLoadTemplate: () => void;
  onSaveAsTemplate: () => void;
  onCopyLastTime: () => void;

  // published-mode actions
  onEditAsDraft: () => void;
  onUnpublish: () => void;
}

export default function Toolbar({
  date,
  mode,
  onSelectMode,
  hasPublished,
  hasDraft,
  dirty,
  publishedAt,
  draftUpdatedAt,
  onSaveDraft,
  onPublish,
  onDiscardDraft,
  onLoadTemplate,
  onSaveAsTemplate,
  onCopyLastTime,
  onEditAsDraft,
  onUnpublish,
}: ToolbarProps) {
  return (
    <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">📅 Today Plan</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Beijing Time: {date}</p>

          {/* Tabs */}
          <div className="mt-4 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
            <TabButton
              active={mode === "published"}
              onClick={() => onSelectMode("published")}
              disabled={!hasPublished}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${
                    hasPublished ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                {hasPublished ? "Published (live)" : "Not published"}
              </span>
            </TabButton>
            <TabButton
              active={mode === "draft"}
              onClick={() => onSelectMode("draft")}
            >
              <span className="inline-flex items-center gap-2">
                Draft
                {(hasDraft || dirty) && (
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-amber-500"
                    title={dirty ? "Unsaved changes" : "Draft exists"}
                  />
                )}
              </span>
            </TabButton>
          </div>

          {/* Sub-line: timestamp for current mode */}
          <p className="mt-3 text-xs text-slate-500">
            {mode === "published" && hasPublished && publishedAt && (
              <>Published {formatBeijingTime(publishedAt)}</>
            )}
            {mode === "published" && !hasPublished && (
              <>Nothing is live for this date yet.</>
            )}
            {mode === "draft" && draftUpdatedAt && !dirty && (
              <>Draft saved {formatBeijingTime(draftUpdatedAt)}</>
            )}
            {mode === "draft" && dirty && (
              <span className="text-amber-700">● Unsaved changes</span>
            )}
            {mode === "draft" && !draftUpdatedAt && !dirty && (
              <>New draft — nothing saved yet.</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {mode === "draft" ? (
            <>
              <Button variant="outline" onClick={onCopyLastTime}>
                Copy Last Time
              </Button>
              <Button variant="outline" onClick={onLoadTemplate}>
                Load Template
              </Button>
              <Button variant="outline" onClick={onSaveAsTemplate}>
                Save as Template
              </Button>
              {hasDraft && (
                <Button
                  variant="outline"
                  onClick={onDiscardDraft}
                  className="text-red-600 hover:text-red-700"
                >
                  Discard Draft
                </Button>
              )}
              <Button variant="outline" onClick={onSaveDraft}>
                Save Draft
              </Button>
              <Button
                onClick={onPublish}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Publish
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onEditAsDraft}>
                Edit as Draft
              </Button>
              {hasPublished && (
                <Button
                  onClick={onUnpublish}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Unpublish
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
        {mode === "draft" ? (
          <>
            💡 Editing a private draft. The live plan is untouched until you
            press <strong>Publish</strong>.
          </>
        ) : (
          <>
            👀 Viewing what kids see right now. To change it, click{" "}
            <strong>Edit as Draft</strong>.
          </>
        )}
      </p>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, disabled, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
          : "text-slate-600 hover:text-slate-900"
      } ${disabled ? "cursor-not-allowed opacity-50 hover:text-slate-600" : ""}`}
    >
      {children}
    </button>
  );
}
