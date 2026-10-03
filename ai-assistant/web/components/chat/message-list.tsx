"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownIcon, PencilIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message } from "@/components/chat/message";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/types";

const NEAR_BOTTOM_PX = 120;

export function MessageList({
  conversation,
  streaming,
  onRegenerate,
  onFeedback,
  onRename,
}: {
  conversation: Conversation;
  streaming: boolean;
  onRegenerate: (id: string) => void;
  onFeedback: (id: string, value: "up" | "down") => void;
  onRename: (id: string, title: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const nearBottom = () => {
    const el = scroller.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "auto") =>
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior });

  // Jump to the end when switching conversations.
  useEffect(() => {
    stick.current = true;
    scrollToBottom();
  }, [conversation.id]);

  // Follow the stream only while the user is at the bottom.
  useEffect(() => {
    if (stick.current) scrollToBottom();
  }, [conversation.messages]);

  return (
    <div className="relative min-h-0 flex-1">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/50 sticky top-0 z-10 backdrop-blur">
        <h2 className="text-sm font-medium truncate">{conversation.title}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8">
              <PencilIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => {
              const newTitle = prompt("Rename chat:", conversation.title);
              if (newTitle && newTitle !== conversation.title) onRename(conversation.id, newTitle);
            }}>
              Rename
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        ref={scroller}
        role="log"
        aria-live="polite"
        aria-busy={streaming}
        className="h-full overflow-y-auto overscroll-contain"
        onScroll={() => {
          stick.current = nearBottom();
          setShowJump(!stick.current);
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pt-4 pb-10 sm:px-6">
          {conversation.messages.map((m, i) => (
            <Message
              key={m.id}
              message={m}
              isLast={i === conversation.messages.length - 1}
              lookingIds={
                m.pending && !m.content
                  ? Array.isArray(conversation.messages[i - 1]?.images)
                    ? conversation.messages[i - 1]?.images?.map((img) => img.id)
                    : undefined
                  : undefined
              }
              onRegenerate={onRegenerate}
              onFeedback={onFeedback}
            />
          ))}
        </div>
      </div>
      {showJump && (
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Scroll to latest message"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md"
          onClick={() => {
            stick.current = true;
            scrollToBottom("smooth");
          }}
        >
          <ArrowDownIcon />
        </Button>
      )}
    </div>
  );
}
