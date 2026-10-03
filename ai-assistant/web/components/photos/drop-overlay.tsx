"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlusIcon, FilePlusIcon, PlusCircleIcon } from "lucide-react";

import { looksLikeImage } from "@/lib/images";

const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes("Files");

/** Document extensions accepted on drop. */
const DOC_EXTENSIONS = new Set([
  ".pdf", ".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml", ".toml",
  ".ini", ".cfg", ".conf", ".log",
  ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".cpp", ".h", ".hpp",
  ".cs", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".scala", ".r",
  ".sql", ".sh", ".bash", ".zsh", ".ps1", ".bat", ".cmd",
  ".html", ".css", ".scss", ".less", ".vue", ".svelte",
]);

function looksLikeDocument(file: File): boolean {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return DOC_EXTENSIONS.has(name.slice(dot));
}

/** Lets files be dropped anywhere on the page, and photos pasted from the clipboard. */
export function PhotoDropZone({
  enabled,
  onFiles,
  onDocFiles,
  limitText,
}: {
  enabled: boolean;
  onFiles: (files: File[]) => void;
  onDocFiles?: (files: File[]) => void;
  limitText: string;
}) {
  const [over, setOver] = useState(false);
  const live = useRef({ enabled, onFiles, onDocFiles });
  useEffect(() => {
    live.current = { enabled, onFiles, onDocFiles };
    if (!enabled) setOver(false);
  });

  // Always listening: a file dropped while photos are off (e.g. voice mode)
  // must not make the browser leave the app to open it.
  useEffect(() => {
    let depth = 0;
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (!live.current.enabled) return;
      depth++;
      setOver(true);
    };
    const overFn = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) setOver(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setOver(false);
      if (!live.current.enabled) return;

      const allFiles = [...(e.dataTransfer?.files ?? [])];
      const images = allFiles.filter(looksLikeImage);
      const docs = allFiles.filter(looksLikeDocument);

      if (images.length) live.current.onFiles(images);
      if (docs.length && live.current.onDocFiles) live.current.onDocFiles(docs);
    };
    const paste = (e: ClipboardEvent) => {
      if (!live.current.enabled) return;
      const files = [...(e.clipboardData?.files ?? [])].filter(looksLikeImage);
      if (!files.length) return;
      // Office apps put text *and* a picture of it on the clipboard. Pasting
      // into a text field should give the text.
      const target = e.target instanceof Element ? e.target : null;
      const editable = !!target?.closest("textarea, input, [contenteditable='true']");
      if (editable && e.clipboardData?.getData("text/plain").trim()) return;
      e.preventDefault();
      live.current.onFiles(files);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOver(false);
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", overFn);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    window.addEventListener("keydown", key);
    document.addEventListener("paste", paste);
    return () => {
      setOver(false);
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", overFn);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
      window.removeEventListener("keydown", key);
      document.removeEventListener("paste", paste);
    };
  }, []);

  if (!over) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-background/80 p-6 backdrop-blur-sm" aria-hidden>
      <div className="flex w-full max-w-md flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-foreground/30 bg-card px-6 py-10 text-center shadow-lg">
        <PlusCircleIcon className="size-8" />
        <p className="text-base font-semibold">Drop files to add them</p>
        <p className="text-sm text-muted-foreground">{limitText}</p>
        <p className="text-xs text-muted-foreground">Photos, PDFs, code files, and text documents</p>
      </div>
    </div>
  );
}
