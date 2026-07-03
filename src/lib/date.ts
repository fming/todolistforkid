// All business date logic pins to Beijing time (Asia/Shanghai, UTC+8)
// so day boundaries follow China local time regardless of client/server TZ.

const BEIJING_TZ = "Asia/Shanghai";

const beijingDateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: BEIJING_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's YYYY-MM-DD in Beijing time. */
export function todayInBeijing(now: Date = new Date()): string {
  const parts = beijingDateParts.formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** Add `days` (may be negative) to a YYYY-MM-DD string. */
export function shiftIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Format an ISO timestamp as HH:MM:SS in Beijing time. */
export function formatBeijingTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("zh-CN", {
    timeZone: BEIJING_TZ,
    hour12: false,
  });
}
