import { NextRequest, NextResponse } from "next/server";

import {
  isTemplateKey,
  loadTemplate,
  instantiateTemplate,
} from "@/services/templateService";

/**
 * GET /api/templates?name=weekday|weekend
 *
 * Returns { name, key, tasks } where tasks already carry fresh UUIDs so the
 * admin client can drop them straight into the editor.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name || !isTemplateKey(name)) {
    return NextResponse.json(
      { error: "Invalid template name" },
      { status: 400 }
    );
  }

  const template = await loadTemplate(name);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: template.name,
    key: template.key,
    tasks: instantiateTemplate(template),
  });
}
