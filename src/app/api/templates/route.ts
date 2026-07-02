import { NextRequest, NextResponse } from "next/server";

import {
  instantiateTemplate,
  loadDefaultTemplate,
  saveDefaultTemplate,
} from "@/services/templateService";
import type { Task } from "@/types/task";

/**
 * GET /api/templates — returns the default template with fresh UUIDs so the
 * admin editor can drop the tasks straight into a plan.
 */
export async function GET() {
  const template = await loadDefaultTemplate();
  return NextResponse.json({
    name: template.name,
    tasks: instantiateTemplate(template),
  });
}

/**
 * PUT /api/templates — overwrite the default template with the given tasks.
 * Body: { tasks: Task[]; name?: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { tasks?: Task[]; name?: string };
    if (!Array.isArray(body.tasks)) {
      return NextResponse.json({ error: "Invalid tasks" }, { status: 400 });
    }

    const saved = await saveDefaultTemplate(body.tasks, body.name);
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
