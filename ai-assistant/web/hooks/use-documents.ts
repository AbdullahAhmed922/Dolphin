"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { uid } from "@/lib/helpers";
import { uploadDocument } from "@/lib/api";
import type { ChatDocument } from "@/lib/document-types";

/** Allowed document extensions (must match the backend). */
const DOC_EXTENSIONS = new Set([
  ".pdf", ".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml", ".toml",
  ".ini", ".cfg", ".conf", ".log", ".env",
  ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".cpp", ".h", ".hpp",
  ".cs", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".scala", ".r",
  ".sql", ".sh", ".bash", ".zsh", ".ps1", ".bat", ".cmd",
  ".html", ".css", ".scss", ".less", ".vue", ".svelte",
]);

const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_DOCUMENTS = 5;

export const DOCUMENT_ACCEPT = [
  ".pdf",
  ".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml", ".toml",
  ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".cpp", ".h", ".hpp",
  ".cs", ".go", ".rs", ".rb", ".php",
  ".sql", ".sh", ".html", ".css", ".scss",
].join(",");

/** A document in the composer, before it's sent. */
export interface DocumentAttachment {
  id: string;
  name: string;
  size: number;
  extension: string;
  /** Set once the document is uploaded and text extracted. */
  document?: ChatDocument;
  /** Error message if processing failed. */
  error?: string;
}

export interface UseDocuments {
  items: DocumentAttachment[];
  /** True while any document is still being uploaded/processed. */
  processing: boolean;
  /** All successfully processed documents ready to send. */
  ready: ChatDocument[];
  add: (files: File[]) => void;
  remove: (id: string) => void;
  /** Empties the tray after sending. */
  takeAll: () => ChatDocument[];
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function useDocuments(): UseDocuments {
  const [items, setItems] = useState<DocumentAttachment[]>([]);
  const current = useRef<DocumentAttachment[]>([]);

  const commit = useCallback((next: DocumentAttachment[]) => {
    current.current = next;
    setItems(next);
  }, []);

  const add = useCallback(
    (files: File[]) => {
      for (const file of files) {
        const ext = getExtension(file.name);

        if (!DOC_EXTENSIONS.has(ext)) {
          toast.error(`Unsupported file type: ${ext || "unknown"}`, {
            description: "Try PDF, TXT, or code files.",
          });
          continue;
        }

        if (file.size > MAX_DOCUMENT_SIZE) {
          toast.error(`${file.name} is too large`, {
            description: `${formatSize(file.size)} exceeds the ${formatSize(MAX_DOCUMENT_SIZE)} limit.`,
          });
          continue;
        }

        if (current.current.length >= MAX_DOCUMENTS) {
          toast.error(`Up to ${MAX_DOCUMENTS} documents per message`, {
            description: `${file.name} wasn't added.`,
          });
          continue;
        }

        const attachment: DocumentAttachment = {
          id: uid(),
          name: file.name,
          size: file.size,
          extension: ext,
        };
        commit([...current.current, attachment]);

        void (async () => {
          try {
            const result = await uploadDocument(file);

            // Removed while uploading
            if (!current.current.some((a) => a.id === attachment.id)) return;

            const doc: ChatDocument = {
              id: attachment.id,
              name: result.filename,
              extension: result.extension,
              size: result.size,
              charCount: result.char_count,
              text: result.text,
            };

            commit(
              current.current.map((a) =>
                a.id === attachment.id ? { ...a, document: doc } : a,
              ),
            );
          } catch (err) {
            if (!current.current.some((a) => a.id === attachment.id)) return;
            const message = (err as Error).message || "Failed to process document";
            commit(
              current.current.map((a) =>
                a.id === attachment.id ? { ...a, error: message } : a,
              ),
            );
            toast.error(`Couldn't process ${file.name}`, { description: message });
          }
        })();
      }
    },
    [commit],
  );

  const remove = useCallback(
    (id: string) => {
      commit(current.current.filter((a) => a.id !== id));
    },
    [commit],
  );

  const takeAll = useCallback(() => {
    const docs = current.current.flatMap((a) => (a.document ? [a.document] : []));
    commit([]);
    return docs;
  }, [commit]);

  // Cleanup on unmount is not needed (no object URLs or IndexedDB for documents).

  return {
    items,
    processing: items.some((a) => !a.document && !a.error),
    ready: items.flatMap((a) => (a.document ? [a.document] : [])),
    add,
    remove,
    takeAll,
  };
}
