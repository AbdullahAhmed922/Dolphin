"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUpIcon, CameraIcon, FileUpIcon, ImageIcon, PlusIcon, SquareIcon } from "lucide-react";

import { AttachmentTray } from "@/components/photos/attachment-tray";
import { DocumentTray } from "@/components/documents/document-tray";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UseAttachments } from "@/hooks/use-attachments";
import type { UseDocuments } from "@/hooks/use-documents";
import { DOCUMENT_ACCEPT } from "@/hooks/use-documents";
import { APP_CONFIG } from "@/lib/config";
import { ACCEPT_ATTR } from "@/lib/images";
import type { ChatImage } from "@/lib/types";
import type { ChatDocument } from "@/lib/document-types";
import { cn } from "@/lib/utils";

export function Composer({
  onSend,
  onStop,
  attachments,
  documents,
  photoLimit,
  notice,
  blocked,
  streaming,
  disabled,
  placeholder = `Message ${APP_CONFIG.appName}…`,
  autoFocus,
  onVoice,
}: {
  onSend: (text: string, images: ChatImage[], documents: ChatDocument[]) => void;
  onStop: () => void;
  attachments?: UseAttachments;
  documents?: UseDocuments;
  photoLimit?: number;
  notice?: ReactNode;
  blocked?: boolean;
  streaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onVoice?: () => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    if (autoFocus && window.matchMedia("(min-width: 768px)").matches) ref.current?.focus();
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, [autoFocus]);

  const photoCount = attachments?.items.length ?? 0;
  const docCount = documents?.items.length ?? 0;
  const processing = !!attachments?.processing || !!documents?.processing;
  const hasContent = !!value.trim() || photoCount > 0 || docCount > 0;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (streaming) return onStop();
    if (!hasContent || disabled || processing || blocked) return;
    onSend(value, attachments?.takeAll() ?? [], documents?.takeAll() ?? []);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const touch = window.matchMedia("(hover: none)").matches;
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !touch) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = streaming || (hasContent && !disabled && !processing && !blocked);
  const sendLabel = streaming
    ? "Stop generating"
    : processing
      ? "Waiting for files to be ready"
      : "Send message";

  const pick = (input: HTMLInputElement | null) => {
    requestAnimationFrame(() => input?.click());
  };
  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) attachments?.add([...e.target.files]);
    e.target.value = "";
  };
  const onDocFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) documents?.add([...e.target.files]);
    e.target.value = "";
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-3xl rounded-3xl border bg-card p-2.5 pl-4 shadow-sm transition-colors focus-within:border-ring"
    >
      <label htmlFor="composer" className="sr-only">
        Message
      </label>

      {notice}
      {attachments && <AttachmentTray attachments={attachments} />}
      {documents && <DocumentTray documents={documents} />}
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        enterKeyHint="send"
        className="field-sizing-content max-h-52 min-h-7 w-full resize-none bg-transparent py-1.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
      />
      <div className="mt-1 flex items-center gap-2">
        {(attachments || documents) && (
          <>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Add files"
                      disabled={disabled}
                      className="-ml-2 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <PlusIcon />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Add files</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" side="top" className="w-72">
                {attachments && (
                  <>
                    <DropdownMenuItem onSelect={() => pick(fileInput.current)} className="items-start">
                      <ImageIcon className="mt-0.5" />
                      <span className="flex flex-col">
                        <span>Add photos</span>
                        <span className="text-xs text-muted-foreground">
                          JPEG, PNG, WebP or GIF · up to {photoLimit ?? 5}
                        </span>
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => pick(cameraInput.current)} className="items-start">
                      <CameraIcon className="mt-0.5" />
                      <span className="flex flex-col">
                        <span>Take a photo</span>
                        <span className="text-xs text-muted-foreground">
                          {coarse ? "Opens your camera" : "Uses your camera on phones and tablets"}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  </>
                )}
                {documents && (
                  <DropdownMenuItem onSelect={() => pick(docInput.current)} className="items-start">
                    <FileUpIcon className="mt-0.5" />
                    <span className="flex flex-col">
                      <span>Upload documents</span>
                      <span className="text-xs text-muted-foreground">
                        PDF, TXT, code files · up to 5
                      </span>
                    </span>
                  </DropdownMenuItem>
                )}
                <p className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground">
                  You can also paste or drop photos.
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
            {attachments && (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPT_ATTR}
                  multiple
                  hidden
                  onChange={onFiles}
                  data-testid="photo-input"
                />
                <input
                  ref={cameraInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={onFiles}
                />
              </>
            )}
            {documents && (
              <input
                ref={docInput}
                type="file"
                accept={DOCUMENT_ACCEPT}
                multiple
                hidden
                onChange={onDocFiles}
                data-testid="document-input"
              />
            )}
            {photoCount > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                {photoCount} of {photoLimit ?? 5} photos
              </span>
            )}
            {docCount > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                {docCount} document{docCount !== 1 ? "s" : ""}
              </span>
            )}
          </>
        )}
        <div className="flex-1" />
        {streaming ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                onClick={onStop}
                aria-label="Stop generating"
                className="size-8.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm transition-all duration-150 active:scale-95 shrink-0"
              >
                <SquareIcon className="size-3.5 fill-current" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Stop generating</TooltipContent>
          </Tooltip>
        ) : hasContent ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={!canSend}
                aria-label={sendLabel}
                className={cn(
                  "size-8.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm transition-all duration-150 active:scale-95 shrink-0",
                  !canSend && "opacity-40 cursor-not-allowed",
                )}
              >
                <ArrowUpIcon className="size-4.5 stroke-[2.5]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{sendLabel}</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                aria-label="Start Voice Mode"
                onClick={() => {
                  if (onVoice) onVoice();
                }}
                className="size-8.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm transition-all duration-150 active:scale-95 shrink-0"
              >
                <SoundwaveIcon className="size-4 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Voice Mode</TooltipContent>
          </Tooltip>
        )}
      </div>
    </form>
  );
}

function SoundwaveIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="9" width="2.4" height="6" rx="1.2" />
      <rect x="7.5" y="6" width="2.4" height="12" rx="1.2" />
      <rect x="12" y="3" width="2.4" height="18" rx="1.2" />
      <rect x="16.5" y="6" width="2.4" height="12" rx="1.2" />
      <rect x="21" y="9" width="2.4" height="6" rx="1.2" />
    </svg>
  );
}
