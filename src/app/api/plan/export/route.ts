import { listPlans } from "@/services/planService";

/**
 * GET /api/plan/export — download every plan (drafts + published) as a
 * JSON attachment for backup.
 */
export async function GET() {
  const plans = await listPlans({ includeDrafts: true });
  const body = {
    exportedAt: new Date().toISOString(),
    version: 1,
    plans,
  };

  const filename = `planner-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
