import { NextResponse } from "next/server";

import { listPlans } from "@/services/planService";

/**
 * GET /api/plan/history — published plans, newest first.
 */
export async function GET() {
  const plans = await listPlans({ includeDrafts: false });
  return NextResponse.json(plans);
}
