"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  CloudIcon,
  EyeIcon,
  HardDriveIcon,
  RefreshCwIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { UseModels } from "@/hooks/use-models";
import { formatBytes } from "@/lib/helpers";
import type { ModelInfo } from "@/lib/types";

function SeesImages({ model }: { model: ModelInfo }) {
  if (!model.vision) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 text-[10px] leading-4 font-medium text-muted-foreground"
      title="This model can read photos"
    >
      <EyeIcon className="size-2.5" />
      Sees images
    </span>
  );
}

export function ModelPicker({
  models,
  forPhotos = false,
}: {
  models: UseModels;
  /** The chat has photos: Auto shows the model that will look at them. */
  forPhotos?: boolean;
}) {
  const { data, loading, error, selection, select, refresh } = models;
  const effective =
    !selection && forPhotos && data?.default_vision ? data.default_vision : models.effective;

  if (loading && !data) return <Skeleton className="h-9 w-40" />;

  const local = data?.providers.find((p) => p.local);
  const cloud = data?.providers.filter((p) => !p.local) ?? [];
  const cloudReady = cloud.filter((p) => p.available && p.models.length);
  const cloudFailed = cloud.filter((p) => p.configured && !p.available);
  const cloudMissing = cloud.filter((p) => !p.configured);

  const isAuto = !selection;
  const isSelected = (provider: string, id: string) =>
    selection?.provider === provider && selection?.model === id;

  const handleSelect = (sel: { provider: string; model: string } | null) => {
    select(sel);
  };

  const label = effective
    ? `${selection ? "" : "Auto · "}${effective.name}`
    : error
      ? "API offline"
      : "No models";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="max-w-[60vw] gap-1.5 px-2.5 text-[15px] font-semibold">
          {effective?.local === false ? (
            <CloudIcon className="text-muted-foreground" />
          ) : error ? (
            <TriangleAlertIcon className="text-destructive" />
          ) : (
            <HardDriveIcon className="text-muted-foreground" />
          )}
          <span className="truncate">{label}</span>
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-h-[85vh] overflow-y-auto">
        {error && (
          <p className="px-2 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DropdownMenuItem
          onSelect={() => handleSelect(null)}
          className="items-start justify-between cursor-pointer"
        >
          <div className="flex items-start gap-2">
            <SparklesIcon className="mt-0.5 size-4 text-primary shrink-0" />
            <span className="flex flex-col">
              <span className="font-medium">Auto</span>
              <span className="text-xs text-muted-foreground">
                Local model first, cloud fallback. Picks vision model for photos.
              </span>
            </span>
          </div>
          {isAuto && <CheckIcon className="size-4 shrink-0 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5">
          <HardDriveIcon className="size-3.5" /> Local · Ollama
        </DropdownMenuLabel>
        {local?.models.map((m) => {
          const active = isSelected(m.provider, m.id);
          return (
            <DropdownMenuItem
              key={m.id}
              onSelect={() => handleSelect({ provider: m.provider, model: m.id })}
              className="flex items-center gap-2 cursor-pointer"
            >
              {active ? (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              ) : (
                <div className="size-4 shrink-0" />
              )}
              <span className="truncate font-medium">{m.name}</span>
              <SeesImages model={m} />
              <span className="ml-auto pl-2 text-xs text-muted-foreground shrink-0">
                {[m.parameter_size, formatBytes(m.size_bytes)].filter(Boolean).join(" · ")}
              </span>
            </DropdownMenuItem>
          );
        })}
        {local && !local.models.length && (
          <p className="px-2 pb-2 text-xs leading-5 text-muted-foreground">
            {local.available ? "No models installed. " : "Ollama isn't running. "}
            Run <code className="rounded bg-muted px-1 font-mono">ollama pull llama3.2</code>
            {cloudReady.length ? " — cloud models are used meanwhile." : "."}
          </p>
        )}

        {cloudReady.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1.5">
              <CloudIcon className="size-3.5" /> Cloud (fallback)
            </DropdownMenuLabel>
            {cloudReady.map((p) => (
              <DropdownMenuSub key={p.id}>
                <DropdownMenuSubTrigger>
                  {p.label}
                  <span className="ml-auto text-xs text-muted-foreground">{p.models.length}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-80 w-72 overflow-y-auto">
                  {p.models.map((m) => {
                    const active = isSelected(m.provider, m.id);
                    return (
                      <DropdownMenuItem
                        key={m.id}
                        onSelect={() => handleSelect({ provider: m.provider, model: m.id })}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {active ? (
                          <CheckIcon className="size-4 shrink-0 text-primary" />
                        ) : (
                          <div className="size-4 shrink-0" />
                        )}
                        <span className="truncate font-medium">{m.name}</span>
                        <span className="ml-auto pl-2">
                          <SeesImages model={m} />
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </>
        )}
        {cloudFailed.map((p) => (
          <p key={p.id} className="px-2 py-1 text-xs text-muted-foreground">
            {p.label}: {p.error ?? "unavailable"}
          </p>
        ))}
        {!cloudReady.length && !cloudFailed.length && (
          <p className="px-2 pb-2 text-xs leading-5 text-muted-foreground">
            No cloud keys configured. Add one to <code className="font-mono">api/.env</code>.
          </p>
        )}
        {cloudMissing.length > 0 && cloudReady.length > 0 && (
          <p className="px-2 pb-1 text-xs text-muted-foreground">
            Not configured: {cloudMissing.map((p) => p.label).join(", ")}
          </p>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void refresh();
          }}
          className="cursor-pointer"
        >
          <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
          Refresh models
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
