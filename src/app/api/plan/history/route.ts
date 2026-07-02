import { NextResponse } from "next/server";

import { clearAllPlans, listPlans } from "@/services/planService";

/**
 * GET /api/plan/history — published plans, newest first.
 */
export async function GET() {
  const plans = await listPlans({ includeDrafts: false });
  return NextResponse.json(plans);
}

/**
 * DELETE /api/plan/history — wipe every plan file (drafts + published).
 */
export async function DELETE() {
  const removed = await clearAllPlans();
  return NextResponse.json({ removed });
}
