"use client";

import { useMemo } from "react";
import {
  useMultibandTrackVolume,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import {
  MicIcon,
  MicOffIcon,
  SparklesIcon,
  AudioLinesIcon,
  Volume2Icon,
  RadioIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceUiState } from "@/components/voice/voice-bar";

interface VoiceVisualizerProps {
  state: VoiceUiState;
  userTrack?: TrackReferenceOrPlaceholder;
  agentTrack?: TrackReferenceOrPlaceholder;
  subtitleText?: string;
  subtitleRole?: "user" | "assistant";
  subtitleFinal?: boolean;
  modelName?: string;
  className?: string;
}

const DEFAULT_RESTING = [0.15, 0.25, 0.4, 0.55, 0.7, 0.5, 0.35, 0.2];

export function VoiceVisualizer({
  state,
  userTrack,
  agentTrack,
  subtitleText,
  subtitleRole,
  subtitleFinal,
  modelName,
  className,
}: VoiceVisualizerProps) {
  // Determine which track to visualize based on active speaker
  const activeTrack = useMemo(() => {
    if (state === "listening") return userTrack;
    if (state === "speaking") return agentTrack;
    return undefined;
  }, [state, userTrack, agentTrack]);

  // Read live 12-band frequency spectrum from LiveKit
  const rawBands = useMultibandTrackVolume(activeTrack, { bands: 12 });
  const isAudioActive = state === "listening" || state === "speaking";

  // Compute live volume amplitude (0 to 1)
  const volume = useMemo(() => {
    if (!isAudioActive || !rawBands || rawBands.length === 0) return 0;
    const avg = rawBands.reduce((sum, b) => sum + b, 0) / rawBands.length;
    return Math.min(1, avg * 2.2);
  }, [isAudioActive, rawBands]);

  // Frequency bands for rendering the spectrum ribbon
  const bands = useMemo(() => {
    if (isAudioActive && rawBands.length === 12) {
      return rawBands;
    }
    return DEFAULT_RESTING;
  }, [isAudioActive, rawBands]);

  // Theme palettes and copy depending on state
  const config = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          title: "I'm Listening",
          subtitle: "Speak naturally — I will respond when you pause",
          badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          dotColor: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
          orbGradient: "from-emerald-500/80 via-neutral-800 to-neutral-950",
          orbGlow: "rgba(16, 185, 129, 0.25)",
          ringColor: "border-border/60",
          barColor: "bg-emerald-500",
          icon: MicIcon,
        };
      case "speaking":
        return {
          title: "Assistant Speaking",
          subtitle: "Press Esc or speak anytime to interrupt",
          badgeColor: "bg-secondary border-border text-foreground",
          dotColor: "bg-violet-500 shadow-[0_0_8px_#8b5cf6]",
          orbGradient: "from-violet-500/80 via-neutral-800 to-neutral-950",
          orbGlow: "rgba(139, 92, 246, 0.25)",
          ringColor: "border-border/60",
          barColor: "bg-foreground",
          icon: Volume2Icon,
        };
      case "thinking":
        return {
          title: "Thinking…",
          subtitle: "Formulating response",
          badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
          dotColor: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
          orbGradient: "from-amber-500/80 via-neutral-800 to-neutral-950",
          orbGlow: "rgba(245, 158, 11, 0.25)",
          ringColor: "border-border/60",
          barColor: "bg-amber-500",
          icon: SparklesIcon,
        };
      case "connecting":
        return {
          title: "Connecting…",
          subtitle: "Setting up your audio session",
          badgeColor: "bg-muted border-border text-muted-foreground",
          dotColor: "bg-primary/70",
          orbGradient: "from-neutral-700 via-neutral-800 to-neutral-950",
          orbGlow: "rgba(120, 120, 120, 0.15)",
          ringColor: "border-border/40",
          barColor: "bg-muted-foreground",
          icon: RadioIcon,
        };
      case "reconnecting":
        return {
          title: "Reconnecting…",
          subtitle: "Connection dropped. Restoring…",
          badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
          dotColor: "bg-amber-500",
          orbGradient: "from-amber-600/70 via-neutral-800 to-neutral-950",
          orbGlow: "rgba(245, 158, 11, 0.2)",
          ringColor: "border-border/50",
          barColor: "bg-amber-500",
          icon: RadioIcon,
        };
      case "mic-blocked":
        return {
          title: "Microphone Needed",
          subtitle: "Allow microphone access in your browser settings",
          badgeColor: "bg-destructive/10 border-destructive/20 text-destructive",
          dotColor: "bg-destructive",
          orbGradient: "from-destructive/80 via-neutral-800 to-neutral-950",
          orbGlow: "rgba(239, 68, 68, 0.25)",
          ringColor: "border-destructive/30",
          barColor: "bg-destructive",
          icon: MicOffIcon,
        };
      case "failed":
        return {
          title: "Voice Unavailable",
          subtitle: "Could not connect to voice agent",
          badgeColor: "bg-destructive/10 border-destructive/20 text-destructive",
          dotColor: "bg-destructive",
          orbGradient: "from-destructive/80 via-neutral-800 to-neutral-950",
          orbGlow: "rgba(239, 68, 68, 0.25)",
          ringColor: "border-destructive/30",
          barColor: "bg-destructive",
          icon: AlertTriangleIcon,
        };
      case "ended":
      default:
        return {
          title: "Session Ended",
          subtitle: "Start again or go back to typing",
          badgeColor: "bg-muted border-border text-muted-foreground",
          dotColor: "bg-muted-foreground",
          orbGradient: "from-neutral-700 via-neutral-850 to-neutral-950",
          orbGlow: "rgba(100, 100, 100, 0.1)",
          ringColor: "border-border/30",
          barColor: "bg-muted-foreground",
          icon: AudioLinesIcon,
        };
    }
  }, [state]);

  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden px-4 select-none",
        className,
      )}
    >
      {/* Subtle Ambient Radial Highlight */}
      <div
        className="pointer-events-none absolute -top-1/4 -left-1/4 h-[150%] w-[150%] blur-3xl opacity-20 transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${config.orbGlow} 0%, transparent 60%)`,
        }}
      />

      {/* Main Orb Centerpiece */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Dynamic Concentric Sound Rings */}
        <div className="relative flex items-center justify-center">
          {/* Outermost expanding ripple ring */}
          <div
            className={cn(
              "absolute rounded-full border transition-all duration-150 ease-out",
              config.ringColor,
            )}
            style={{
              width: "300px",
              height: "300px",
              transform: `scale(${1 + volume * 0.4})`,
              opacity: state === "speaking" || state === "listening" ? 0.35 + volume * 0.45 : 0.15,
            }}
          />

          {/* Middle harmonic ring */}
          <div
            className={cn(
              "absolute rounded-full border transition-all duration-100 ease-out",
              config.ringColor,
            )}
            style={{
              width: "250px",
              height: "250px",
              transform: `scale(${1 + volume * 0.28})`,
              opacity: state === "speaking" || state === "listening" ? 0.5 + volume * 0.4 : 0.25,
            }}
          />

          {/* Inner tight halo ring */}
          <div
            className={cn(
              "absolute rounded-full border transition-all duration-75 ease-out",
              config.ringColor,
            )}
            style={{
              width: "205px",
              height: "205px",
              transform: `scale(${1 + volume * 0.16})`,
              opacity: 0.75 + volume * 0.25,
            }}
          />

          {/* Subtle Ambient Glow behind Orb */}
          <div
            className={cn(
              "absolute rounded-full blur-xl transition-all duration-500",
              state === "thinking"
                ? "animate-[orb-spin-slow_6s_linear_infinite]"
                : "animate-[orb-core-breathe_4s_ease-in-out_infinite]",
            )}
            style={{
              width: "180px",
              height: "180px",
              background: `radial-gradient(circle, ${config.orbGlow} 0%, transparent 75%)`,
              transform: `scale(${1 + volume * 0.4})`,
            }}
          />

          {/* Core Orb Container */}
          <div
            className={cn(
              "relative flex size-36 sm:size-40 items-center justify-center rounded-full border border-border shadow-md transition-transform duration-100",
              "cursor-default overflow-hidden bg-card",
            )}
            style={{
              transform: `scale(${1 + volume * 0.2})`,
            }}
          >
            {/* Spherical gradient */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-tr",
                config.orbGradient,
                state === "thinking" && "animate-[orb-spin-slow_8s_linear_infinite]",
              )}
            />

            {/* Specular glass reflection */}
            <div className="absolute top-2 left-4 size-14 rounded-full bg-white/10 blur-[1px] -rotate-45" />

            {/* Center status icon */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 text-foreground drop-shadow-sm">
              <StatusIcon
                className={cn(
                  "size-7 transition-transform duration-150",
                  (state === "speaking" || state === "listening") && "scale-110",
                )}
              />
              {modelName && (
                <span className="font-mono text-[10px] tracking-wider uppercase opacity-75 max-w-[85px] truncate text-center">
                  {modelName.split("/").pop()?.split(":")[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Audio Spectrum Frequency Bars */}
        <div className="mt-7 flex h-8 items-center justify-center gap-1.5">
          {bands.map((val, idx) => {
            const h =
              isAudioActive
                ? Math.max(4, Math.min(28, Math.round(val * 38)))
                : state === "thinking"
                  ? Math.sin(Date.now() / 200 + idx) * 6 + 10
                  : 4;
            return (
              <span
                key={idx}
                className={cn(
                  "w-1 rounded-full transition-[height] duration-75",
                  config.barColor,
                )}
                style={{
                  height: `${h}px`,
                  opacity: isAudioActive ? 0.6 + val * 0.4 : 0.35,
                }}
              />
            );
          })}
        </div>

        {/* Status Badge & Helper Text */}
        <div className="mt-4 flex flex-col items-center text-center">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold tracking-wide transition-all",
              config.badgeColor,
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full animate-pulse",
                config.dotColor,
              )}
            />
            <span>{config.title}</span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground font-normal max-w-sm px-4">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Floating Subtitle Banner */}
      {subtitleText && (
        <div className="relative z-20 mt-6 w-full max-w-xl px-4 animate-[voice-subtitles-in_0.25s_ease-out]">
          <div className="group relative flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 shadow-md">
            <div className="flex items-center justify-between text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                {subtitleRole === "user" ? (
                  <>
                    <MicIcon className="size-3" /> You
                  </>
                ) : (
                  <>
                    <Volume2Icon className="size-3" /> Assistant
                  </>
                )}
              </span>
              <span className="text-[10px]">
                {subtitleFinal ? "Spoken" : "Transcribing…"}
              </span>
            </div>

            <p className="text-[15px] leading-relaxed text-foreground font-medium break-words">
              {subtitleText}
              {!subtitleFinal && (
                <span className="ml-1 inline-block h-3.5 w-0.5 bg-foreground animate-pulse align-middle" />
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
