import { NextRequest, NextResponse } from "next/server";

import {
  getPlan,
  savePlan,
  submitTask,
  cancelSubmission,
} from "@/services/planService";
import type { DayPlan } from "@/types/day-plan";

/**
 * GET /api/plan?date=2026-07-02&draft=1
 *
 * Without `draft=1`, drafts are hidden from callers (kid view). When no plan
 * exists (or a draft is hidden), we return a stable empty shape so clients
 * don't need a 404 branch.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const includeDraft = searchParams.get("draft") === "1";

  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const plan = await getPlan(date, { includeDraft });

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
 * POST /api/plan — save a plan (admin). New plans default to "draft".
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DayPlan;

    if (!body.date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }
    if (!Array.isArray(body.tasks)) {
      return NextResponse.json({ error: "Invalid tasks" }, { status: 400 });
    }

    const saved = await savePlan(body);
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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
