import { NextRequest, NextResponse } from "next/server";

import { verifyTask } from "@/services/planService";

/**
 * PATCH /api/plan/verify — parent approves or rejects a submitted task.
 * Body: { date, id, decision: "approve" | "reject", comment?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      date?: string;
      id?: string;
      decision?: "approve" | "reject";
      comment?: string;
    };

    if (
      !body.date ||
      !body.id ||
      (body.decision !== "approve" && body.decision !== "reject")
    ) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updated = await verifyTask(body.date, body.id, body.decision, body.comment);
    if (!updated) {
      return NextResponse.json(
        { error: "Plan not published, task not found, or not pending" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
