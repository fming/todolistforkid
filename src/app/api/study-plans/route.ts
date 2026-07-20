import { NextRequest, NextResponse } from "next/server";

import {
  deleteStudyPlan,
  listStudyPlans,
  saveStudyPlan,
} from "@/services/studyPlanService";

/**
 * GET /api/study-plans — return all subject plans, sorted by subject.
 */
export async function GET() {
  const plans = await listStudyPlans();
  return NextResponse.json({ plans });
}

/**
 * PUT /api/study-plans — upsert a plan.
 * Body: { subject: string; content: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      subject?: string;
      content?: string;
    };
    if (!body.subject || typeof body.content !== "string") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const saved = await saveStudyPlan(body.subject, body.content);
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/study-plans?subject=语文
 */
export async function DELETE(req: NextRequest) {
  const subject = new URL(req.url).searchParams.get("subject");
  if (!subject) {
    return NextResponse.json({ error: "Missing subject" }, { status: 400 });
  }
  await deleteStudyPlan(subject);
  return NextResponse.json({ ok: true });
}
