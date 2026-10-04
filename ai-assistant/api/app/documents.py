"""Extract text content from uploaded documents.

Supports PDF (via PyMuPDF), plain text, and common code files.
"""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# File extensions grouped by category.
TEXT_EXTENSIONS = {
    ".txt",
    ".md",
    ".csv",
    ".json",
    ".xml",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".log",
    ".env",
    ".gitignore",
    ".dockerignore",
}
CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".go",
    ".rs",
    ".rb",
    ".php",
    ".swift",
    ".kt",
    ".scala",
    ".r",
    ".sql",
    ".sh",
    ".bash",
    ".zsh",
    ".ps1",
    ".bat",
    ".cmd",
    ".html",
    ".css",
    ".scss",
    ".less",
    ".vue",
    ".svelte",
}
PDF_EXTENSIONS = {".pdf"}
ALL_ALLOWED = TEXT_EXTENSIONS | CODE_EXTENSIONS | PDF_EXTENSIONS

# 20 MB hard ceiling for document uploads.
MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
# Extracted text is capped so the LLM context isn't overwhelmed.
MAX_EXTRACTED_CHARS = 100_000


class DocumentError(Exception):
    """Raised when a document can't be processed."""


def allowed_extension(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALL_ALLOWED


def _language_label(ext: str) -> str:
    """Return a Markdown code-fence language hint for an extension."""
    mapping = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".tsx": "tsx",
        ".jsx": "jsx",
        ".java": "java",
        ".c": "c",
        ".cpp": "cpp",
        ".h": "c",
        ".hpp": "cpp",
        ".cs": "csharp",
        ".go": "go",
        ".rs": "rust",
        ".rb": "ruby",
        ".php": "php",
        ".swift": "swift",
        ".kt": "kotlin",
        ".scala": "scala",
        ".r": "r",
        ".sql": "sql",
        ".sh": "bash",
        ".bash": "bash",
        ".zsh": "zsh",
        ".ps1": "powershell",
        ".bat": "batch",
        ".html": "html",
        ".css": "css",
        ".scss": "scss",
        ".less": "less",
        ".vue": "vue",
        ".svelte": "svelte",
        ".json": "json",
        ".xml": "xml",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".toml": "toml",
        ".md": "markdown",
    }
    return mapping.get(ext.lower(), "")


def extract_pdf(content: bytes) -> str:
    """Extract text from a PDF using PyMuPDF."""
    try:
        import pymupdf  # noqa: PLC0415
    except ImportError as exc:
        raise DocumentError("PDF support requires pymupdf: uv add pymupdf") from exc

    try:
        doc = pymupdf.open(stream=content, filetype="pdf")
    except Exception as exc:
        raise DocumentError(f"Couldn't open the PDF: {exc}") from exc

    pages: list[str] = []
    for i, page in enumerate(doc, 1):
        text = page.get_text("text").strip()
        if text:
            pages.append(f"--- Page {i} ---\n{text}")
    doc.close()

    if not pages:
        raise DocumentError("The PDF has no readable text (it may be scanned images).")

    full = "\n\n".join(pages)
    if len(full) > MAX_EXTRACTED_CHARS:
        full = full[:MAX_EXTRACTED_CHARS] + f"\n\n[Truncated — {len(full):,} characters total]"
    return full


def extract_text(content: bytes, filename: str) -> str:
    """Extract text from a plain text or code file."""
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            text = content.decode(encoding)
            break
        except (UnicodeDecodeError, ValueError):
            continue
    else:
        raise DocumentError("Couldn't decode the file — it may be binary.")

    ext = Path(filename).suffix.lower()
    lang = _language_label(ext)

    if ext in CODE_EXTENSIONS and lang:
        formatted = f"```{lang}\n{text.rstrip()}\n```"
    else:
        formatted = text.rstrip()

    if len(formatted) > MAX_EXTRACTED_CHARS:
        formatted = (
            formatted[:MAX_EXTRACTED_CHARS] + f"\n\n[Truncated — {len(text):,} characters total]"
        )
    return formatted


def extract_document(content: bytes, filename: str) -> str:
    """Route to the correct extractor based on file extension."""
    ext = Path(filename).suffix.lower()
    if ext in PDF_EXTENSIONS:
        return extract_pdf(content)
    if ext in TEXT_EXTENSIONS | CODE_EXTENSIONS:
        return extract_text(content, filename)
    raise DocumentError(
        f"Unsupported file type '{ext}'. "
        f"Supported: PDF, text files ({', '.join(sorted(TEXT_EXTENSIONS))}), "
        f"code files ({', '.join(sorted(CODE_EXTENSIONS))})"
    )
