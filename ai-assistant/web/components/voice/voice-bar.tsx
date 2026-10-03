"use client";

import { useMediaDeviceSelect } from "@livekit/components-react";
import {
  CaptionsIcon,
  CheckIcon,
  LoaderCircleIcon,
  MicIcon,
  MicOffIcon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
  SquareIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { LevelBars } from "@/components/voice/level-bars";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import type { VoiceOptionInfo } from "@/lib/voice";
import { cn } from "@/lib/utils";

export type VoiceUiState =
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "reconnecting"
  | "mic-blocked"
  | "failed"
  | "ended";

export interface VoiceBarProps {
  state: VoiceUiState;
  micEnabled: boolean;
  micTrack?: TrackReferenceOrPlaceholder;
  errorMessage?: string;
  voices: VoiceOptionInfo[];
  voice: string | null;
  captions: boolean;
  onVoiceChange: (id: string | null) => void;
  onCaptionsChange: (on: boolean) => void;
  onToggleMic: () => void;
  onStop: () => void;
  onEnd: () => void;
  onRetry: () => void;
}

const shell =
  "mx-auto flex min-h-16 w-full max-w-2xl items-center gap-2 sm:gap-3 rounded-full border border-border bg-card p-2 px-3 shadow-md text-card-foreground transition-all";

function EndButton({ onEnd }: { onEnd: () => void }) {
  return (
    <Button
      variant="ghost"
      onClick={onEnd}
      aria-label="End voice mode"
      className="h-11 shrink-0 rounded-full border border-border bg-muted/30 px-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
    >
      <XIcon className="size-4" />
      <span className="hidden sm:inline font-medium text-xs tracking-wide">End</span>
    </Button>
  );
}

export function VoiceBar(props: VoiceBarProps) {
  const { state, micEnabled, captions, onCaptionsChange, onToggleMic, onStop, onEnd, onRetry } = props;

  // Handle failure, mic blocked, or ended state
  if (state === "mic-blocked" || state === "failed" || state === "ended") {
    const isError = state !== "ended";
    const title =
      state === "mic-blocked"
        ? "Microphone access is blocked"
        : state === "ended"
          ? "Voice session ended"
          : "Voice mode couldn't start";

    return (
      <div
        role="alert"
        className={cn(
          shell,
          isError ? "border-destructive/40" : "border-border",
        )}
      >
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full",
            isError ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
          )}
        >
          <TriangleAlertIcon className="size-5" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col leading-snug">
          <span className={cn("text-sm font-semibold tracking-tight", isError ? "text-destructive" : "text-foreground")}>
            {title}
          </span>
          {props.errorMessage && (
            <span className="line-clamp-2 text-xs text-muted-foreground">{props.errorMessage}</span>
          )}
        </span>

        <Button
          variant="outline"
          onClick={onEnd}
          className="h-10 shrink-0 rounded-full px-4 text-xs font-medium"
        >
          Type instead
        </Button>
        <Button
          onClick={onRetry}
          className="h-10 shrink-0 rounded-full px-4 text-xs font-medium"
        >
          <RefreshCwIcon className="size-3.5 mr-1" />
          <span>Try again</span>
        </Button>
      </div>
    );
  }

  const busy = state === "connecting" || state === "reconnecting";
  const canStop = state === "speaking" || state === "thinking";

  let statusText: React.ReactNode;
  if (state === "connecting") {
    statusText = <span className="text-muted-foreground text-xs font-medium">Connecting…</span>;
  } else if (state === "reconnecting") {
    statusText = <span className="text-amber-500 text-xs font-medium">Reconnecting…</span>;
  } else if (!micEnabled) {
    statusText = (
      <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
        <span>Mic muted</span>
        <span className="hidden sm:inline text-muted-foreground">· tap to unmute</span>
      </span>
    );
  } else if (state === "listening") {
    statusText = (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground">Listening</span>
        <LevelBars track={props.micTrack} />
      </div>
    );
  } else if (state === "thinking") {
    statusText = (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Thinking</span>
        <span aria-hidden="true" className="inline-flex gap-1">
          {[0, 150, 300].map((d) => (
            <i
              key={d}
              className="size-1 rounded-full bg-muted-foreground motion-safe:animate-[voice-blink_1.2s_ease-in-out_infinite]"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </span>
      </div>
    );
  } else {
    statusText = (
      <span className="text-xs text-muted-foreground font-medium truncate">
        Speaking… <span className="hidden sm:inline text-muted-foreground/70">talk anytime to interrupt</span>
      </span>
    );
  }

  return (
    <div role="group" aria-label="Voice controls" className={shell}>
      {/* Microphone Toggle Button */}
      {busy ? (
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
          {state === "connecting" ? (
            <LoaderCircleIcon className="size-5 motion-safe:animate-spin" />
          ) : (
            <RefreshCwIcon className="size-4 motion-safe:animate-spin text-amber-500" />
          )}
        </span>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={micEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={onToggleMic}
              aria-pressed={!micEnabled}
              aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
              className={cn(
                "size-11 shrink-0 rounded-full transition-all",
                micEnabled
                  ? "border border-border bg-secondary hover:bg-accent text-foreground shadow-sm"
                  : "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25",
              )}
            >
              {micEnabled ? <MicIcon className="size-5" /> : <MicOffIcon className="size-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {micEnabled ? "Mute microphone" : "Unmute microphone"}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Live Status indicator */}
      <span role="status" className="flex min-w-0 flex-1 items-center gap-2 truncate px-1">
        {statusText}
      </span>

      {/* Quick Captions Toggle Button */}
      {!busy && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCaptionsChange(!captions)}
              aria-label={captions ? "Hide subtitles" : "Show subtitles"}
              className={cn(
                "size-10 shrink-0 rounded-full border transition-all",
                captions
                  ? "border-border bg-secondary text-foreground shadow-sm"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <CaptionsIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {captions ? "Captions on" : "Captions off"}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Settings (Audio Device & Voice Model Selector) */}
      {!busy && <VoiceSettings {...props} />}

      {/* Stop / Interrupt Button (when agent is speaking/thinking) */}
      {canStop && (
        <Button
          variant="outline"
          onClick={onStop}
          aria-label="Stop the reply"
          className="h-11 shrink-0 rounded-full border border-border bg-secondary hover:bg-accent text-foreground shadow-sm px-3.5"
        >
          <SquareIcon className="size-3.5 fill-current" />
          <span className="hidden sm:inline font-medium text-xs">Stop (Esc)</span>
        </Button>
      )}

      {/* End Session Button */}
      <EndButton onEnd={onEnd} />
    </div>
  );
}

function VoiceSettings({
  voices,
  voice,
  captions,
  onVoiceChange,
  onCaptionsChange,
}: VoiceBarProps) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind: "audioinput",
    requestPermissions: false,
  });

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Voice settings"
              className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          Audio & voice settings
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        side="top"
        align="end"
        className="w-72 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
      >
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
          Microphone Input
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={activeDeviceId}
          onValueChange={(id) => void setActiveMediaDevice(id)}
        >
          {devices.length === 0 && (
            <p className="px-2 py-1 text-xs text-muted-foreground">System default</p>
          )}
          {devices.map((d, i) => (
            <DropdownMenuRadioItem
              key={d.deviceId || i}
              value={d.deviceId}
              className="rounded-lg text-xs"
            >
              <span className="truncate">{d.label || `Microphone ${i + 1}`}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        {voices.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Voice Persona
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={voice ?? "__default"}
              onValueChange={(id) => onVoiceChange(id === "__default" ? null : id)}
            >
              <DropdownMenuRadioItem
                value="__default"
                className="rounded-lg text-xs"
              >
                Default AI Voice
              </DropdownMenuRadioItem>
              {voices.map((v) => (
                <DropdownMenuRadioItem
                  key={v.id}
                  value={v.id}
                  className="rounded-lg text-xs items-start"
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{v.name}</span>
                    {v.description && (
                      <span className="text-[11px] text-muted-foreground">{v.description}</span>
                    )}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}

        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          className="rounded-lg text-xs"
          onSelect={(e) => {
            e.preventDefault();
            onCaptionsChange(!captions);
          }}
        >
          <span className="flex-1">Live subtitles overlay</span>
          {captions && <CheckIcon className="size-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
