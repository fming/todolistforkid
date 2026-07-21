"use client";

import { useCallback, useEffect, useState } from "react";

import PendingReviewList from "@/components/admin/PendingReviewList";
import StatusBanner, {
  type BannerState,
  type BannerKind,
} from "@/components/admin/StatusBanner";
import TaskList from "@/components/admin/TaskList";
import Toolbar, { type PlanMode } from "@/components/admin/Toolbar";

import { DEFAULT_TASK } from "@/lib/constants";
import { todayInBeijing } from "@/lib/date";
import type { DayPlan } from "@/types/day-plan";
import type { Task } from "@/types/task";

interface AdminPlanResponse {
  date: string;
  published: DayPlan | null;
  draft: DayPlan | null;
}

export default function TodayPage() {
  const [date] = useState(todayInBeijing);

  const [published, setPublished] = useState<DayPlan | null>(null);
  const [draft, setDraft] = useState<DayPlan | null>(null);
  /** Local, unsaved edits to the draft. Null means "no local edits yet". */
  const [draftTasks, setDraftTasks] = useState<Task[] | null>(null);

  const [mode, setMode] = useState<PlanMode>("draft");
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<BannerState | null>(null);

  const notify = useCallback((kind: BannerKind, message: string) => {
    setBanner({ kind, message });
  }, []);

  const loadPlan = useCallback(
    async (target: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/plan?date=${target}&admin=1`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as AdminPlanResponse;
        setPublished(data.published);
        setDraft(data.draft);
        setDraftTasks(null);
        // Default tab: draft if one exists in-progress, otherwise show what's
        // live so the admin doesn't miss pending submissions.
        setMode(data.draft ? "draft" : data.published ? "published" : "draft");
      } catch {
        notify("error", "Failed to load plan.");
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    void loadPlan(date);
  }, [date, loadPlan]);

  /** Tasks to render on the Draft tab (unsaved edits win, else server draft, else empty). */
  const currentDraftTasks: Task[] =
    draftTasks ?? draft?.tasks ?? [];
  const dirty = draftTasks !== null;
  const hasDraft = draft !== null || dirty;
  const hasPublished = published !== null;

  // ---------------------------------------------------------------------------
  // Draft-mode actions
  // ---------------------------------------------------------------------------

  async function handleSaveDraft() {
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, tasks: currentDraftTasks }),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = (await res.json()) as DayPlan;
      setDraft(saved);
      setDraftTasks(null);
      notify("success", "Draft saved. The live plan is unchanged.");
    } catch {
      notify("error", "Save failed.");
    }
  }

  async function handlePublish() {
    const confirmMsg = hasPublished
      ? "Publish this draft? It will replace the currently live plan and clear any pending submissions or verifications on it."
      : "Publish this draft? Kids will see it right away.";
    if (!confirm(confirmMsg)) return;

    try {
      // Save any unsaved edits first so publish sees the latest tasks.
      if (dirty || !draft) {
        const saveRes = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, tasks: currentDraftTasks }),
        });
        if (!saveRes.ok) throw new Error("save failed");
        const saved = (await saveRes.json()) as DayPlan;
        setDraft(saved);
        setDraftTasks(null);
      }

      const pubRes = await fetch("/api/plan/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!pubRes.ok) throw new Error("publish failed");
      const nowPublished = (await pubRes.json()) as DayPlan;

      setPublished(nowPublished);
      setDraft(null);
      setDraftTasks(null);
      setMode("published");
      notify("success", "Plan published — kids can see it now.");
    } catch {
      notify("error", "Publish failed.");
    }
  }

  async function handleDiscardDraft() {
    if (!hasDraft) return;
    if (
      !confirm(
        "Discard the draft? Any unpublished changes will be lost. The live plan is not affected."
      )
    )
      return;

    try {
      const res = await fetch(`/api/plan?date=${date}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDraft(null);
      setDraftTasks(null);
      notify("info", "Draft discarded.");
      // If nothing lives here, stay on draft (blank slate). Otherwise switch to
      // published so the admin sees what's live.
      if (published) setMode("published");
    } catch {
      notify("error", "Discard failed.");
    }
  }

  async function handleLoadTemplate() {
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { name: string; tasks: Task[] };
      setDraftTasks(data.tasks);
      setMode("draft");
      notify(
        "info",
        `Loaded template "${data.name}" into draft. Remember to save.`
      );
    } catch {
      notify("error", "Failed to load template.");
    }
  }

  async function handleSaveAsTemplate() {
    if (currentDraftTasks.length === 0) {
      notify("info", "Add at least one task before saving the template.");
      return;
    }
    if (!confirm("Replace the current template with these tasks?")) return;

    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: currentDraftTasks }),
      });
      if (!res.ok) throw new Error();
      notify("success", "Template updated.");
    } catch {
      notify("error", "Failed to save template.");
    }
  }

  async function handleCopyLastTime() {
    try {
      const res = await fetch("/api/plan/history");
      if (!res.ok) throw new Error();
      const plans = (await res.json()) as DayPlan[];

      const previous = plans.find(
        (p) => p.date < date && p.tasks.length > 0
      );
      if (!previous) {
        notify("info", "No previous plan to copy.");
        return;
      }

      const cloned: Task[] = previous.tasks.map((t) => ({
        ...t,
        id: crypto.randomUUID(),
        status: "todo",
        completed: false,
        submittedAt: undefined,
        verifiedAt: undefined,
        adminComment: undefined,
      }));
      setDraftTasks(cloned);
      setMode("draft");
      notify(
        "info",
        `Copied ${cloned.length} tasks from ${previous.date} into draft.`
      );
    } catch {
      notify("error", "Copy Last Time failed.");
    }
  }

  // ---------------------------------------------------------------------------
  // Published-mode actions
  // ---------------------------------------------------------------------------

  async function handleEditAsDraft() {
    if (!published) return;
    if (hasDraft) {
      if (
        !confirm(
          "A draft already exists. Continue editing the existing draft?"
        )
      )
        return;
      setMode("draft");
      return;
    }

    // Seed a new draft from the published tasks (fresh todo state).
    const seeded: Task[] = published.tasks.map((t) => ({
      ...t,
      status: "todo",
      completed: false,
      submittedAt: undefined,
      verifiedAt: undefined,
      adminComment: undefined,
    }));

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, tasks: seeded }),
      });
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as DayPlan;
      setDraft(saved);
      setDraftTasks(null);
      setMode("draft");
      notify(
        "info",
        "Draft created from the live plan. Edits here won't affect kids until you Publish."
      );
    } catch {
      notify("error", "Failed to create draft.");
    }
  }

  async function handleUnpublish() {
    if (!published) return;
    if (hasDraft) {
      notify(
        "error",
        "A draft already exists for this date. Discard the draft first, then unpublish."
      );
      return;
    }
    if (
      !confirm(
        "Unpublish? Kids will stop seeing this plan. Its contents move into the draft slot so you can keep editing."
      )
    )
      return;

    try {
      const res = await fetch("/api/plan/publish", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; reason?: string }
          | null;
        if (body?.reason === "draft-exists") {
          notify(
            "error",
            "A draft already exists for this date. Discard the draft first."
          );
          return;
        }
        throw new Error();
      }
      const asDraft = (await res.json()) as DayPlan;
      setPublished(null);
      setDraft(asDraft);
      setDraftTasks(null);
      setMode("draft");
      notify("info", "Plan reverted to draft.");
    } catch {
      notify("error", "Unpublish failed.");
    }
  }

  // ---------------------------------------------------------------------------
  // Task-list editing (draft mode only) & pending review (published mode only)
  // ---------------------------------------------------------------------------

  function updateTask<K extends keyof Task>(
    id: string,
    field: K,
    value: Task[K]
  ) {
    setDraftTasks((prev) => {
      const base = prev ?? draft?.tasks ?? [];
      return base.map((t) => (t.id === id ? { ...t, [field]: value } : t));
    });
  }

  function addTask() {
    setDraftTasks((prev) => {
      const base = prev ?? draft?.tasks ?? [];
      return [...base, { id: crypto.randomUUID(), ...DEFAULT_TASK }];
    });
  }

  function deleteTask(id: string) {
    setDraftTasks((prev) => {
      const base = prev ?? draft?.tasks ?? [];
      return base.filter((t) => t.id !== id);
    });
  }

  function handleSelectMode(next: PlanMode) {
    if (next === mode) return;
    if (next === "published" && !hasPublished) return;
    if (mode === "draft" && next === "published" && dirty) {
      if (
        !confirm(
          "You have unsaved draft edits. Switch to the Published tab and lose them?"
        )
      )
        return;
      setDraftTasks(null);
    }
    setMode(next);
  }

  return (
    <>
      <StatusBanner banner={banner} onDismiss={() => setBanner(null)} />

      <Toolbar
        date={date}
        mode={mode}
        onSelectMode={handleSelectMode}
        hasPublished={hasPublished}
        hasDraft={hasDraft}
        dirty={dirty}
        publishedAt={published?.publishedAt}
        draftUpdatedAt={draft?.updatedAt}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onDiscardDraft={handleDiscardDraft}
        onLoadTemplate={handleLoadTemplate}
        onSaveAsTemplate={handleSaveAsTemplate}
        onCopyLastTime={handleCopyLastTime}
        onEditAsDraft={handleEditAsDraft}
        onUnpublish={handleUnpublish}
      />

      {loading ? (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
          Loading plan...
        </div>
      ) : mode === "published" ? (
        <PublishedView
          plan={published}
          onPlanUpdated={(p) => setPublished(p)}
          onError={(msg) => notify("error", msg)}
          onInfo={(msg) => notify("info", msg)}
        />
      ) : (
        <TaskList
          tasks={currentDraftTasks}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      )}
    </>
  );
}

/**
 * Read-only view of the currently live plan, plus the pending review list.
 * Editing is only possible via "Edit as Draft".
 */
function PublishedView({
  plan,
  onPlanUpdated,
  onError,
  onInfo,
}: {
  plan: DayPlan | null;
  onPlanUpdated: (plan: DayPlan) => void;
  onError: (message: string) => void;
  onInfo: (message: string) => void;
}) {
  if (!plan) {
    return (
      <div className="rounded-2xl border-2 border-dashed bg-white p-10 text-center text-slate-500">
        Nothing is live for this date yet. Switch to the <strong>Draft</strong>{" "}
        tab to build a plan and Publish it.
      </div>
    );
  }

  return (
    <>
      <PendingReviewList
        plan={plan}
        onDecided={(updated) => {
          onPlanUpdated(updated);
          onInfo("Verification saved.");
        }}
        onError={onError}
      />

      <TaskList
        tasks={plan.tasks}
        showStatus
        readOnly
        onAddTask={() => {}}
        onUpdateTask={() => {}}
        onDeleteTask={() => {}}
      />
    </>
  );
}
