"use client";

export type BannerKind = "info" | "success" | "error";

export interface BannerState {
  kind: BannerKind;
  message: string;
}

const BANNER_STYLES: Record<BannerKind, string> = {
  info: "bg-slate-100 text-slate-800 ring-slate-200",
  success: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  error: "bg-red-100 text-red-800 ring-red-200",
};

interface StatusBannerProps {
  banner: BannerState | null;
  onDismiss: () => void;
}

export default function StatusBanner({ banner, onDismiss }: StatusBannerProps) {
  if (!banner) return null;
  return (
    <div
      className={`mb-4 flex items-start justify-between gap-4 rounded-lg px-4 py-3 text-sm ring-1 ${BANNER_STYLES[banner.kind]}`}
    >
      <span>{banner.message}</span>
      <button
        onClick={onDismiss}
        className="text-current/70 hover:text-current"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
