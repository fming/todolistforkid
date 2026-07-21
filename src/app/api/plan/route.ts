import { NextRequest, NextResponse } from "next/server";

import {
  getPublishedPlan,
  getDraft,
  saveDraft,
  discardDraft,
  submitTask,
  cancelSubmission,
} from "@/services/planService";
import type { Task } from "@/types/task";

/**
 * GET /api/plan?date=2026-07-02          → kid view: published plan only.
 * GET /api/plan?date=2026-07-02&admin=1  → admin view: { published, draft }.
 *
 * Kid view returns a stable "empty" shape when there is no published plan,
 * so callers don't need a 404 branch.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const isAdmin = searchParams.get("admin") === "1";

  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  if (isAdmin) {
    const [published, draft] = await Promise.all([
      getPublishedPlan(date),
      getDraft(date),
    ]);
    return NextResponse.json({ date, published, draft });
  }

  const plan = await getPublishedPlan(date);
  if (!plan) {
    return NextResponse.json({
      date,
      status: "empty" as const,
      tasks: [],
    });
  }
  return NextResponse.json(plan);
}

/**
 * POST /api/plan — admin saves the draft for a date. Never touches the
 * currently published plan.
 * Body: { date, tasks }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { date?: string; tasks?: Task[] };

    if (!body.date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }
    if (!Array.isArray(body.tasks)) {
      return NextResponse.json({ error: "Invalid tasks" }, { status: 400 });
    }

    const saved = await saveDraft(body.date, body.tasks);
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/plan?date=YYYY-MM-DD — admin discards the draft for a date.
 * The published plan is untouched.
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }
  const removed = await discardDraft(date);
  return NextResponse.json({ removed });
}

/**
 * PATCH /api/plan — kid submits or cancels a task.
 * Body: { date, id, action: "submit" | "cancel" }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      date?: string;
      id?: string;
      action?: "submit" | "cancel";
    };

    if (!body.date || !body.id || (body.action !== "submit" && body.action !== "cancel")) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updated =
      body.action === "submit"
        ? await submitTask(body.date, body.id)
        : await cancelSubmission(body.date, body.id);

    if (!updated) {
      return NextResponse.json(
        { error: "Plan not published, task not found, or illegal transition" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
