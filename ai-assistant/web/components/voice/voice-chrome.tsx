"use client";

import { useEffect, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";

/** Live "● 01:23" pill for the header matching app theme tokens. */
export function VoiceTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div
      role="timer"
      aria-label={`Voice session, ${mm} minutes ${ss} seconds`}
      className="flex h-8 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 text-[13px] text-muted-foreground shadow-sm"
    >
      <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
      <span className="font-semibold text-foreground text-xs tracking-wide">LIVE</span>
      <span className="font-mono text-xs tabular-nums text-foreground">
        {mm}:{ss}
      </span>
    </div>
  );
}

/** Shown for the moment it takes to download and initialize the voice module. */
export function VoiceLoading() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-4 bg-background text-muted-foreground">
      <div className="relative flex items-center justify-center">
        <div className="relative grid size-14 place-items-center rounded-2xl border border-border bg-card shadow-sm">
          <LoaderCircleIcon className="size-6 text-foreground motion-safe:animate-spin" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-semibold text-foreground tracking-tight">Starting Voice Mode</span>
        <span className="text-xs text-muted-foreground">Connecting to real-time audio pipeline…</span>
      </div>
    </div>
  );
}
