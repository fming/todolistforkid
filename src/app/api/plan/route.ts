import { NextRequest, NextResponse } from "next/server";

import { readJSON, writeJSON } from "@/lib/storage";
import type { Task } from "@/types/task";

type DayPlan = {
  date: string;
  tasks: Task[];
};

/**
 * GET /api/plan?date=2026-07-02
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Missing date" },
      { status: 400 }
    );
  }

  const data = await readJSON<DayPlan>(
    `plans/${date}.json`
  );

  if (!data) {
    return NextResponse.json({
      date,
      tasks: [],
    });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/plan
 * body: { date: string, tasks: Task[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DayPlan;

    if (!body.date) {
      return NextResponse.json(
        { error: "Missing date" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.tasks)) {
      return NextResponse.json(
        { error: "Invalid tasks" },
        { status: 400 }
      );
    }

    await writeJSON(
      `plans/${body.date}.json`,
      body
    );

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}