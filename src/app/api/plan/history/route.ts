import { NextResponse } from "next/server";

import { clearAllPlans, listPublishedPlans } from "@/services/planService";

/**
 * GET /api/plan/history — published plans, newest first.
 */
export async function GET() {
  const plans = await listPublishedPlans();
  return NextResponse.json(plans);
}

/**
 * DELETE /api/plan/history — wipe every plan file (drafts + published).
 */
export async function DELETE() {
  const removed = await clearAllPlans();
  return NextResponse.json({ removed });
}
