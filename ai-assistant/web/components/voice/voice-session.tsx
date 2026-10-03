"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RoomAudioRenderer,
  SessionEvent,
  SessionProvider,
  useAgent,
  useLocalParticipant,
  useSession,
  useSessionContext,
  useSessionMessages,
  type ReceivedMessage,
} from "@livekit/components-react";
import { ConnectionState, TokenSource } from "livekit-client";
import {
  AudioLinesIcon,
  BotIcon,
  MicIcon,
  SparklesIcon,
  TriangleAlertIcon,
  WavesIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { LevelBars } from "@/components/voice/level-bars";
import { VoiceVisualizer } from "@/components/voice/voice-visualizer";
import { VoiceBar, type VoiceUiState } from "@/components/voice/voice-bar";
import { VoiceTimer } from "@/components/voice/voice-chrome";
import "@/components/voice/voice.css";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AGENT_ATTR,
  TRANSCRIPTION_FINAL_ATTR,
  createVoiceSession,
  createSonicVoiceSession,
  type VoiceHistoryMessage,
  type VoiceModelSelection,
  type VoiceOptionInfo,
  type VoiceReplyMeta,
  type VoiceTranscript,
} from "@/lib/voice";

export interface VoiceSessionProps {
  /** Whether to use the SonicAi voice agent instead of the default. */
  sonic?: boolean;
  /** Model picked in the host app (null = automatic). */
  selection: VoiceModelSelection;
  /** Shown to the agent as the participant name. */
  participantName: string;
  /** Earlier messages of the open chat, so voice continues the conversation. */
  history: VoiceHistoryMessage[];
  voices: VoiceOptionInfo[];
  voice: string | null;
  captions: boolean;
  onPrefsChange: (patch: { voice?: string | null; captions?: boolean }) => void;
  /** Finished transcripts in spoken order. Save with upsert by `id`. */
  onTranscripts: (messages: VoiceTranscript[]) => void;
  onEnd: () => void;
  onRetry: () => void;
  /** Renders assistant text (e.g. your Markdown component). Defaults to plain text. */
  renderText?: (text: string) => React.ReactNode;
}

function PlainText(text: string) {
  return <p className="whitespace-pre-wrap">{text}</p>;
}

const AGENT_CONNECT_TIMEOUT_MS = 20_000;

function isMicPermissionError(err: unknown): boolean {
  const e = err as { name?: string; message?: string };
  return (
    e?.name === "NotAllowedError" ||
    e?.name === "NotFoundError" ||
    e?.name === "NotReadableError" ||
    /permission|denied|not allowed|requested device not found/i.test(e?.message ?? "")
  );
}

function micErrorText(err: unknown): string {
  const name = (err as { name?: string })?.name;
  if (name === "NotFoundError") return "No microphone was found. Connect one and try again.";
  if (name === "NotReadableError") return "Your microphone is being used by another app.";
  return "Allow microphone access in your browser's site settings, then try again.";
}

export default function VoiceSession(props: VoiceSessionProps) {
  const inputs = useRef(props);
  useEffect(() => {
    inputs.current = props;
  });

  const [setupError, setSetupError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const tokenSource = useMemo(
    () =>
      TokenSource.literal(async () => {
        const { selection, voice, participantName, history, sonic } = inputs.current;
        try {
          if (sonic) {
            const res = await createSonicVoiceSession();
            return { serverUrl: res.server_url, participantToken: res.participant_token };
          }
          const res = await createVoiceSession({ selection, voice, participantName, history });
          return { serverUrl: res.server_url, participantToken: res.participant_token };
        } catch (err) {
          setSetupError((err as Error).message);
          throw err;
        }
      }),
    [],
  );

  const session = useSession(tokenSource, {
    agentConnectTimeoutMilliseconds: AGENT_CONNECT_TIMEOUT_MS,
  });
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      sessionRef.current
        .start({ tracks: { microphone: { enabled: true } } })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (isMicPermissionError(err)) setMicError(micErrorText(err));
          else setSetupError((prev) => prev ?? (err as Error)?.message ?? "Could not connect.");
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      void sessionRef.current.end();
    };
  }, []);

  useEffect(() => {
    const emitter = session.internal.emitter;
    const onMediaError = (err: Error) => setMicError(micErrorText(err));
    emitter.on(SessionEvent.MediaDevicesError, onMediaError);
    return () => {
      emitter.off(SessionEvent.MediaDevicesError, onMediaError);
    };
  }, [session.internal.emitter]);

  return (
    <SessionProvider session={session}>
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-background text-foreground font-sans">
        <RoomAudioRenderer />
        <VoiceView {...props} setupError={setupError} micError={micError} />
      </div>
    </SessionProvider>
  );
}

type Transcript = Extract<ReceivedMessage, { type: "userTranscript" | "agentTranscript" }>;

function isTranscript(m: ReceivedMessage): m is Transcript {
  return m.type === "userTranscript" || m.type === "agentTranscript";
}

function metaFrom(attributes: Record<string, string>): VoiceReplyMeta | undefined {
  const model = attributes[AGENT_ATTR.model];
  if (!model) return undefined;
  const notice = attributes[AGENT_ATTR.notice] || null;
  return {
    provider: attributes[AGENT_ATTR.provider] ?? "",
    provider_label: attributes[AGENT_ATTR.provider] ?? "",
    model,
    local: attributes[AGENT_ATTR.local] === "true",
    fallback: !!notice,
    notice,
  };
}

function VoiceView({
  renderText = PlainText,
  voices,
  voice,
  captions,
  sonic,
  onPrefsChange,
  onTranscripts,
  onEnd,
  onRetry,
  setupError,
  micError,
}: VoiceSessionProps & { setupError: string | null; micError: string | null }) {
  const session = useSessionContext();
  const agent = useAgent();
  const { messages } = useSessionMessages();
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

  // Mode: "visualizer" (hero orb + subtitles) vs "transcript" (chat log view)
  const [activeTab, setActiveTab] = useState<"visualizer" | "transcript">("visualizer");

  const transcripts = useMemo(
    () => messages.filter(isTranscript).filter((m) => m.message.trim()),
    [messages],
  );

  // ---- state calculation ----
  const everConnected = useRef(false);
  if (session.isConnected) everConnected.current = true;

  const connection = session.connectionState;
  let state: VoiceUiState;
  if (micError) state = "mic-blocked";
  else if (setupError || agent.state === "failed") state = "failed";
  else if (connection === ConnectionState.Reconnecting || connection === ConnectionState.SignalReconnecting)
    state = "reconnecting";
  else if (connection === ConnectionState.Disconnected && everConnected.current) state = "ended";
  else if (agent.state === "listening" || agent.state === "thinking" || agent.state === "speaking")
    state = agent.state;
  else state = "connecting";

  const failure =
    micError ??
    setupError ??
    (agent.state === "failed"
      ? `${agent.failureReasons.join(" ") || "The voice agent didn't join."} Make sure the agent is running and uses the same LiveKit project.`
      : state === "ended"
        ? "The connection to the voice agent closed."
        : undefined);

  // ---- save finished transcripts ----
  const saved = useRef(new Map<string, string>());
  const pendingSave = useRef<Transcript[]>([]);
  const agentAttrs = useRef(agent.attributes);
  useEffect(() => {
    agentAttrs.current = agent.attributes;
  });

  const toChatMessage = useCallback(
    (m: Transcript): VoiceTranscript => ({
      id: `voice-${m.id}`,
      role: m.type === "userTranscript" ? "user" : "assistant",
      content: m.message.trim(),
      createdAt: m.timestamp,
      voice: true,
      meta: m.type === "agentTranscript" ? metaFrom(agentAttrs.current) : undefined,
    }),
    [],
  );

  useEffect(() => {
    const agentBusy = agent.state === "speaking" || agent.state === "thinking";
    const batch: VoiceTranscript[] = [];
    let blocked = false;
    for (let i = 0; i < transcripts.length; i++) {
      const m = transcripts[i];
      const text = m.message.trim();
      const previous = saved.current.get(m.id);
      if (previous !== undefined) {
        if (previous !== text) {
          saved.current.set(m.id, text);
          batch.push(toChatMessage(m));
        }
        continue;
      }
      if (blocked) continue;
      const done =
        m.type === "userTranscript"
          ? m.attributes?.[TRANSCRIPTION_FINAL_ATTR] === "true" || i < transcripts.length - 1
          : !agentBusy;
      if (!done) {
        blocked = true;
        continue;
      }
      saved.current.set(m.id, text);
      batch.push(toChatMessage(m));
    }
    if (batch.length) onTranscripts(batch);
    pendingSave.current = transcripts.filter((m) => !saved.current.has(m.id));
  }, [transcripts, agent.state, onTranscripts, toChatMessage]);

  const onTranscriptsRef = useRef(onTranscripts);
  useEffect(() => {
    onTranscriptsRef.current = onTranscripts;
  });
  useEffect(
    () => () => {
      const rest = pendingSave.current.map(toChatMessage);
      if (rest.length) onTranscriptsRef.current(rest);
    },
    [toChatMessage],
  );

  // ---- actions ----
  const interrupt = useCallback(async () => {
    if (!agent.identity) return;
    try {
      await session.room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: "interrupt",
        payload: "",
      });
    } catch {
      toast.error("Couldn't stop the reply.");
    }
  }, [agent.identity, session.room]);

  const toggleMic = useCallback(async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      toast.error("Couldn't change the microphone.");
    }
  }, [isMicrophoneEnabled, localParticipant]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inOverlay = (e.target as HTMLElement | null)?.closest?.(
        '[role="menu"],[role="dialog"],[role="listbox"]',
      );
      if (e.key !== "Escape" || e.defaultPrevented || inOverlay) return;
      if (agent.state === "speaking" || agent.state === "thinking") {
        e.preventDefault();
        void interrupt();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [agent.state, interrupt]);

  // Auto-scroll transcript container
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [transcripts, state, activeTab]);

  const notice = agent.attributes[AGENT_ATTR.notice];
  const replyError = agent.attributes[AGENT_ATTR.error];
  const model = agent.attributes[AGENT_ATTR.model] || (sonic ? "SonicAi Gemma 4" : "Voice AI");
  const lastAgentIndex = transcripts.findLastIndex((m) => m.type === "agentTranscript");

  // Active subtitle for the visualizer view
  const lastTranscript = transcripts[transcripts.length - 1];
  const subtitleText = captions && lastTranscript ? lastTranscript.message : undefined;
  const subtitleRole = lastTranscript ? (lastTranscript.type === "userTranscript" ? "user" : "assistant") : undefined;
  const subtitleFinal =
    lastTranscript?.type === "userTranscript"
      ? lastTranscript.attributes?.[TRANSCRIPTION_FINAL_ATTR] === "true"
      : agent.state !== "speaking" && agent.state !== "thinking";

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Top HUD / Header matching app theme */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
        {/* Left: Brand & Model Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-foreground">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="font-semibold tracking-tight">
              {sonic ? "SonicAi" : "Voice"}
            </span>
            <span className="text-muted-foreground/60">|</span>
            <span className="font-mono text-[11px] text-muted-foreground max-w-[120px] truncate sm:max-w-[200px]">
              {model.split("/").pop()}
            </span>
          </div>
        </div>

        {/* Center: Segmented View Mode Switcher */}
        <div className="flex items-center rounded-full border border-border bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("visualizer")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200",
              activeTab === "visualizer"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <WavesIcon className="size-3.5" />
            <span>Visualizer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("transcript")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200",
              activeTab === "transcript"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <AudioLinesIcon className="size-3.5" />
            <span>Transcript</span>
            {transcripts.length > 0 && (
              <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                {transcripts.length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Live Timer & Close Button */}
        <div className="flex items-center gap-2">
          <VoiceTimer startedAt={Date.now()} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEnd}
                aria-label="Exit voice mode"
                className="size-9 rounded-full border border-border hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Exit voice mode</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Main View Area */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === "visualizer" ? (
          /* Orb Visualizer View */
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            <VoiceVisualizer
              state={state}
              userTrack={session.local.microphoneTrack}
              agentTrack={agent.microphoneTrack}
              subtitleText={subtitleText}
              subtitleRole={subtitleRole}
              subtitleFinal={subtitleFinal}
              modelName={model}
            />
          </div>
        ) : (
          /* Transcript Feed View matching MessageList in message.tsx */
          <div
            ref={scroller}
            role="log"
            aria-live="polite"
            aria-label="Voice conversation log"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-8"
            onScroll={(e) => {
              const el = e.currentTarget;
              stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            }}
          >
            <div className="mx-auto flex max-w-2xl flex-col gap-6">
              {/* Mini Status Card */}
              <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-full bg-secondary text-foreground">
                    <SparklesIcon className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold capitalize text-foreground">{state}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {state === "speaking" ? "AI speaking" : "Microphone active"}
                    </div>
                  </div>
                </div>
                {state === "speaking" && <LevelBars track={agent.microphoneTrack} />}
                {state === "listening" && <LevelBars track={session.local.microphoneTrack} />}
              </div>

              {transcripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <BotIcon className="size-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium text-foreground">Voice session ready</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start speaking to generate transcripts in real time.
                  </p>
                </div>
              ) : (
                transcripts.map((m, i) =>
                  m.type === "userTranscript" ? (
                    <div key={m.id} className="flex flex-col items-end gap-1.5">
                      <div
                        className={cn(
                          "max-w-[85%] rounded-3xl bg-secondary px-4 py-2.5 text-[15px] leading-7 break-words whitespace-pre-wrap text-secondary-foreground",
                          !(m.attributes?.[TRANSCRIPTION_FINAL_ATTR] === "true" || i < transcripts.length - 1) &&
                            "text-muted-foreground",
                        )}
                      >
                        {m.message}
                        {!(m.attributes?.[TRANSCRIPTION_FINAL_ATTR] === "true" || i < transcripts.length - 1) && (
                          <span
                            aria-hidden="true"
                            className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-current motion-safe:animate-[voice-caret_1s_steps(2,start)_infinite]"
                          />
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground pr-1">
                        <MicIcon className="size-3" />
                        {m.attributes?.[TRANSCRIPTION_FINAL_ATTR] === "true" || i < transcripts.length - 1
                          ? "Spoken"
                          : "Listening…"}
                      </span>
                    </div>
                  ) : (
                    <div key={m.id} className="flex flex-col gap-2">
                      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm text-card-foreground">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <SparklesIcon className="size-3.5" /> Assistant
                          </span>
                          {model && <span className="font-mono text-[11px]">{model.split("/").pop()}</span>}
                        </div>
                        <div className="text-[15px] leading-7 text-card-foreground">
                          {renderText(m.message.replace(/\n?```[\w+#.-]*\s*$/, ""))}
                        </div>
                      </div>

                      {i === lastAgentIndex && (state === "speaking" || state === "thinking") && (
                        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
                          <LevelBars track={agent.microphoneTrack} />
                          <span>{state === "speaking" ? "Speaking…" : "Thinking…"}</span>
                        </div>
                      )}
                    </div>
                  ),
                )
              )}

              {state === "thinking" && transcripts.at(-1)?.type === "userTranscript" && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Assistant is thinking…</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Notice / Error Banner */}
      {(notice || replyError) && state !== "failed" && (
        <div className="relative z-20 mx-auto mb-2 w-full max-w-xl px-4">
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl border p-3 text-xs shadow-sm",
              replyError
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-border bg-muted/60 text-muted-foreground",
            )}
          >
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              {replyError
                ? `Couldn't get a reply: ${replyError}`
                : `Using ${agent.attributes[AGENT_ATTR.provider] || "fallback model"} (${notice}).`}
            </span>
          </div>
        </div>
      )}

      {/* Floating Controls Dock */}
      <div className="relative z-20 shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <VoiceBar
          state={state}
          micEnabled={isMicrophoneEnabled}
          micTrack={session.local.microphoneTrack}
          errorMessage={failure}
          voices={voices}
          voice={voice}
          captions={captions}
          onVoiceChange={(id) => onPrefsChange({ voice: id })}
          onCaptionsChange={(on) => onPrefsChange({ captions: on })}
          onToggleMic={() => void toggleMic()}
          onStop={() => void interrupt()}
          onEnd={onEnd}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
}
