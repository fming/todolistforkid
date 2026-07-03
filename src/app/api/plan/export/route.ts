import { listPlans } from "@/services/planService";
import { todayInBeijing } from "@/lib/date";

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

  const filename = `planner-backup-${todayInBeijing()}.json`;

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
