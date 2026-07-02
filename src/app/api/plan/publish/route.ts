import { NextRequest, NextResponse } from "next/server";

import { publishPlan, unpublishPlan } from "@/services/planService";

/**
 * POST /api/plan/publish  body: { date }
 * DELETE /api/plan/publish body: { date }  (unpublish)
 */
export async function POST(req: NextRequest) {
  try {
    const { date } = (await req.json()) as { date?: string };
    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    const plan = await publishPlan(date);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { date } = (await req.json()) as { date?: string };
    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    const plan = await unpublishPlan(date);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
