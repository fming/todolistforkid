"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBanner, {
  type BannerKind,
  type BannerState,
} from "@/components/admin/StatusBanner";

import { formatBeijingTime } from "@/lib/date";
import type { StudyPlan } from "@/types/study-plan";

export default function StudyPlanPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [preview, setPreview] = useState(true);

  const notify = useCallback((kind: BannerKind, message: string) => {
    setBanner({ kind, message });
  }, []);

  const load = useCallback(
    async (preferSubject?: string | null) => {
      setLoading(true);
      try {
        const res = await fetch("/api/study-plans");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { plans: StudyPlan[] };
        setPlans(data.plans);

        const target =
          preferSubject && data.plans.some((p) => p.subject === preferSubject)
            ? preferSubject
            : data.plans[0]?.subject ?? null;

        setActiveSubject(target);
        const activePlan = data.plans.find((p) => p.subject === target);
        setDraft(activePlan?.content ?? "");
        setDirty(false);
      } catch {
        notify("error", "加载学习计划失败。");
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePlan = useMemo(
    () => plans.find((p) => p.subject === activeSubject) ?? null,
    [plans, activeSubject]
  );

  function switchTo(subject: string) {
    if (dirty && !confirm("有未保存的修改，确定要切换吗？")) return;
    setActiveSubject(subject);
    const plan = plans.find((p) => p.subject === subject);
    setDraft(plan?.content ?? "");
    setDirty(false);
  }

  async function addSubject() {
    const name = newSubject.trim();
    if (!name) return;
    if (plans.some((p) => p.subject === name)) {
      notify("error", "该科目已存在。");
      return;
    }
    try {
      const res = await fetch("/api/study-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: name, content: "" }),
      });
      if (!res.ok) throw new Error();
      setNewSubject("");
      await load(name);
      notify("success", `已新增科目「${name}」。`);
    } catch {
      notify("error", "新增科目失败。");
    }
  }

  async function save() {
    if (!activeSubject) return;
    try {
      const res = await fetch("/api/study-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: activeSubject, content: draft }),
      });
      if (!res.ok) throw new Error();
      await load(activeSubject);
      notify("success", "已保存。");
    } catch {
      notify("error", "保存失败。");
    }
  }

  async function remove() {
    if (!activeSubject) return;
    if (!confirm(`确定删除「${activeSubject}」的学习计划？`)) return;
    try {
      const res = await fetch(
        `/api/study-plans?subject=${encodeURIComponent(activeSubject)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      await load(null);
      notify("success", "已删除。");
    } catch {
      notify("error", "删除失败。");
    }
  }

  return (
    <>
      <StatusBanner banner={banner} onDismiss={() => setBanner(null)} />

      <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">📚 学习计划</h2>
        <p className="mt-1 text-sm text-slate-500">
          每个科目一份 Markdown 文档，用来整理学期/长期学习安排。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            科目
          </div>

          {loading ? (
            <div className="text-sm text-slate-400">加载中...</div>
          ) : plans.length === 0 ? (
            <div className="mb-3 text-sm text-slate-400">还没有科目。</div>
          ) : (
            <ul className="mb-4 space-y-1">
              {plans.map((p) => {
                const active = p.subject === activeSubject;
                return (
                  <li key={p.subject}>
                    <button
                      type="button"
                      onClick={() => switchTo(p.subject)}
                      className={
                        active
                          ? "w-full rounded-md bg-slate-900 px-3 py-2 text-left text-sm font-medium text-white"
                          : "w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                      }
                    >
                      {p.subject}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="space-y-2 border-t pt-3">
            <Input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="新科目名"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addSubject();
                }
              }}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void addSubject()}
              disabled={!newSubject.trim()}
            >
              新增科目
            </Button>
          </div>
        </aside>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          {!activeSubject ? (
            <div className="py-16 text-center text-slate-400">
              请先在左侧新增一个科目。
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {activeSubject}
                  </h3>
                  {activePlan?.updatedAt && (
                    <p className="text-xs text-slate-400">
                      上次保存：{formatBeijingTime(activePlan.updatedAt)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreview((v) => !v)}
                  >
                    {preview ? "隐藏预览" : "显示预览"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={remove}
                    className="text-red-600 hover:text-red-700"
                  >
                    删除
                  </Button>
                  <Button
                    onClick={save}
                    disabled={!dirty}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    保存
                  </Button>
                </div>
              </div>

              <div
                className={
                  preview
                    ? "grid gap-4 md:grid-cols-2"
                    : "grid gap-4"
                }
              >
                <textarea
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setDirty(true);
                  }}
                  spellCheck={false}
                  className="min-h-[65vh] w-full resize-y rounded-lg border bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-800 outline-none focus:border-slate-400"
                  placeholder="用 Markdown 编写这门学科的学习计划..."
                />

                {preview && (
                  <article className="prose prose-slate max-w-none rounded-lg border bg-white p-4">
                    {draft.trim() ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {draft}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-slate-400">预览将在这里显示。</p>
                    )}
                  </article>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
