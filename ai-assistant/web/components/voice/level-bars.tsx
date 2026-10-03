"use client";

import { useMultibandTrackVolume, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const RESTING = [0.3, 0.6, 1, 0.55, 0.35];

/** Modern animated bars that follow a live audio track (mic while listening, agent while speaking). */
export function LevelBars({
  track,
  className,
  color = "default",
}: {
  track?: TrackReferenceOrPlaceholder;
  className?: string;
  color?: "default" | "emerald" | "violet" | "cyan";
}) {
  const bands = useMultibandTrackVolume(track, { bands: 5 });
  const values = track && bands.length === 5 ? bands : RESTING.map((v) => v * 0.35);

  const colorClasses = {
    default: "bg-foreground",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    cyan: "bg-cyan-500",
  };

  return (
    <span aria-hidden="true" className={cn("inline-flex h-5 items-center gap-[3px]", className)}>
      {values.map((v, i) => (
        <i
          key={i}
          className={cn(
            "block w-[3px] rounded-full transition-[height] duration-75",
            colorClasses[color] || "bg-current",
          )}
          style={{ height: `${Math.round(4 + Math.min(1, v * 1.6) * 16)}px` }}
        />
      ))}
    </span>
  );
}

/** Assistant pulse mark matching app theme tokens. */
export function PulseMark({
  size = "md",
  active = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  active?: boolean;
  className?: string;
}) {
  if (size === "lg") {
    return (
      <span
        className={cn(
          "relative grid size-16 shrink-0 place-items-center rounded-2xl bg-foreground text-background shadow-md",
          active && "animate-[voice-pulse_2s_ease-out_infinite]",
          className,
        )}
      >
        <SparklesIcon className="size-7" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative grid size-7 shrink-0 place-items-center rounded-lg bg-foreground text-background shadow-sm",
        active && "animate-[voice-pulse_2s_ease-out_infinite]",
        className,
      )}
    >
      <span className="size-2 rounded-full bg-background" />
    </span>
  );
}
