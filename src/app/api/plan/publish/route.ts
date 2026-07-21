import { NextRequest, NextResponse } from "next/server";

import { publishDraft, unpublishPlan } from "@/services/planService";

/**
 * POST /api/plan/publish   body: { date }
 *   Promotes the current draft to published. Overwrites any existing
 *   published plan for that date and clears the draft.
 *
 * DELETE /api/plan/publish body: { date }
 *   Unpublish: moves the current published plan back into the draft slot.
 *   Refuses (409) if a draft already exists — the admin must discard the
 *   draft first, otherwise the WIP would be lost.
 */
export async function POST(req: NextRequest) {
  try {
    const { date } = (await req.json()) as { date?: string };
    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    const plan = await publishDraft(date);
    if (!plan) {
      return NextResponse.json(
        { error: "No draft to publish for this date." },
        { status: 404 }
      );
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

    const result = await unpublishPlan(date);
    if (!result.ok) {
      if (result.reason === "not-published") {
        return NextResponse.json(
          { error: "No published plan for this date." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          error:
            "A draft already exists for this date. Discard the draft first.",
          reason: "draft-exists",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(result.plan);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
