import { promises as fs } from "fs";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { redis } from "@/lib/redis";
import type { DayPlan } from "@/types/day-plan";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * POST /api/admin/migrate
 * Body: { confirm: "yes" }
 *
 * One-time migration: reads local `data/plans/*.json` and
 * `data/templates/default.json`, writes them into Redis.
 *
 * Run this ONCE locally against your production Upstash instance:
 *   1. Set UPSTASH_REDIS_REST_URL/TOKEN in `.env.local` to production values.
 *   2. `npm run dev`
 *   3. `curl -X POST http://localhost:3000/api/admin/migrate -H "Content-Type: application/json" -d '{"confirm":"yes"}'`
 *   4. Deploy.
 *
 * After migration, delete this file if you want.
 */
export async function POST(req: NextRequest) {
  try {
    const { confirm } = (await req.json()) as { confirm?: string };
    if (confirm !== "yes") {
      return NextResponse.json(
        { error: "Send { confirm: 'yes' } to run migration." },
        { status: 400 }
      );
    }

    // Plans
    const plansDir = path.join(DATA_DIR, "plans");
    let planCount = 0;
    try {
      const files = await fs.readdir(plansDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const raw = await fs.readFile(path.join(plansDir, file), "utf-8");
        const plan = JSON.parse(raw) as DayPlan;
        if (!plan.date) continue;
        await redis.set(`plan:${plan.date}`, plan);
        planCount += 1;
      }
    } catch {
      // no plans directory; that's fine
    }

    // Template
    let templateWritten = false;
    try {
      const raw = await fs.readFile(
        path.join(DATA_DIR, "templates", "default.json"),
        "utf-8"
      );
      const template = JSON.parse(raw);
      await redis.set("template:default", template);
      templateWritten = true;
    } catch {
      // no template file; that's fine
    }

    return NextResponse.json({
      ok: true,
      planCount,
      templateWritten,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
