"use client";

import {
  FileIcon,
  FileTextIcon,
  FileCodeIcon,
  FileSpreadsheetIcon,
  XIcon,
  AlertCircleIcon,
  Loader2Icon,
} from "lucide-react";

import type { UseDocuments, DocumentAttachment } from "@/hooks/use-documents";
import type { ChatDocument } from "@/lib/document-types";

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function formatChars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k chars`;
  return `${count} chars`;
}

function DocIcon({ ext, className }: { ext: string; className?: string }) {
  const codeExts = new Set([
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".cpp", ".h",
    ".cs", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".scala",
    ".sql", ".sh", ".html", ".css", ".scss", ".vue", ".svelte",
  ]);
  const dataExts = new Set([".csv", ".json", ".xml", ".yaml", ".yml", ".toml"]);

  if (ext === ".pdf") return <FileTextIcon className={className} />;
  if (codeExts.has(ext)) return <FileCodeIcon className={className} />;
  if (dataExts.has(ext)) return <FileSpreadsheetIcon className={className} />;
  return <FileIcon className={className} />;
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border bg-background text-foreground shadow-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <XIcon className="size-3" />
    </button>
  );
}

function DocumentChip({
  attachment,
  onRemove,
}: {
  attachment: DocumentAttachment;
  onRemove: () => void;
}) {
  const loading = !attachment.document && !attachment.error;
  const failed = !!attachment.error;

  return (
    <li
      className={`relative flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
        failed
          ? "border-destructive/40 bg-destructive/5"
          : "bg-muted/50 hover:bg-muted"
      }`}
      title={
        attachment.document
          ? `${attachment.name} · ${formatSize(attachment.size)} · ${formatChars(attachment.document.charCount)}`
          : attachment.error
            ? `${attachment.name}: ${attachment.error}`
            : `Processing ${attachment.name}…`
      }
    >
      {loading ? (
        <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : failed ? (
        <AlertCircleIcon className="size-4 shrink-0 text-destructive" />
      ) : (
        <DocIcon ext={attachment.extension} className="size-4 shrink-0 text-muted-foreground" />
      )}

      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium leading-tight">{attachment.name}</span>
        <span className="text-[11px] text-muted-foreground">
          {loading
            ? "Extracting text…"
            : failed
              ? "Failed"
              : `${formatSize(attachment.size)} · ${formatChars(attachment.document!.charCount)}`}
        </span>
      </span>

      <RemoveButton label={`Remove ${attachment.name}`} onClick={onRemove} />
    </li>
  );
}

/** Display documents attached to a message in the chat history. */
export function DocumentBadges({ documents }: { documents: ChatDocument[] }) {
  if (!documents.length) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {documents.map((doc) => (
        <span
          key={doc.id}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/50 px-2.5 py-1 text-xs"
          title={`${doc.name} · ${formatSize(doc.size)} · ${formatChars(doc.charCount)}`}
        >
          <DocIcon ext={doc.extension} className="size-3.5 text-muted-foreground" />
          <span className="max-w-[150px] truncate font-medium">{doc.name}</span>
          <span className="text-muted-foreground">{formatChars(doc.charCount)}</span>
        </span>
      ))}
    </div>
  );
}

/** Documents waiting to be sent. Shown in the composer area. */
export function DocumentTray({ documents }: { documents: UseDocuments }) {
  const { items, remove } = documents;
  if (!items.length) return null;

  return (
    <div className="mb-2">
      <ul className="flex flex-wrap gap-2 pt-1" aria-label="Documents to send">
        {items.map((a) => (
          <DocumentChip key={a.id} attachment={a} onRemove={() => remove(a.id)} />
        ))}
      </ul>
    </div>
  );
}
