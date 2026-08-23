import html
import json
import os
import re
import sqlite3
import zipfile
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional
from xml.etree import ElementTree

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "..",
    "databases",
    "portfolio.db",
)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".."))
BOOKS_DIR = os.path.join(PROJECT_ROOT, "library", "books")

DIFFICULTIES = {"beginner", "intermediate", "advanced"}
SUPPORTED_FORMATS = {"pdf", "epub", "md", "markdown", "html", "htm", "docx"}
ANNOTATION_TYPES = {"bookmark", "comment", "highlight", "underline"}
HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

SEED_BOOKS = [
    {
        "title": "Introducao a Analise de Malware",
        "author": "Athos Lab",
        "difficulty": "beginner",
        "file_name": "malware-analysis-intro.md",
        "custom_badge_label": "malware",
        "custom_badge_color": "#ef4444",
    },
    {
        "title": "Notas de Pentest Web",
        "author": "Athos Lab",
        "difficulty": "intermediate",
        "file_name": "web-pentest-notes.html",
        "custom_badge_label": "pentest web",
        "custom_badge_color": "#38bdf8",
    },
]


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: List[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in {"h1", "h2", "h3", "p", "li", "br"}:
            self.parts.append("\n")

    def handle_data(self, data):
        value = data.strip()
        if value:
            self.parts.append(value)

    def get_text(self) -> str:
        text = " ".join(self.parts)
        text = re.sub(r"\n\s+", "\n", text)
        text = re.sub(r"[ \t]{2,}", " ", text)
        return text.strip()


def _normalize_difficulty(value: str) -> str:
    difficulty = (value or "").strip().lower()
    return difficulty if difficulty in DIFFICULTIES else "beginner"


def _normalize_hex_color(value: str) -> str:
    color = (value or "").strip()
    return color if HEX_COLOR_RE.match(color) else "#00ff88"


def _normalize_annotation_type(value: str) -> str:
    kind = (value or "").strip().lower()
    return kind if kind in ANNOTATION_TYPES else "comment"


def _file_format(file_name: str) -> str:
    ext = os.path.splitext(file_name)[1].lower().replace(".", "")
    return "md" if ext == "markdown" else ext


def _parse_custom_badge_label(label: str) -> List[str]:
    if not label:
        return []
    try:
        parsed = json.loads(label)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
        return [str(parsed)]
    except json.JSONDecodeError:
        return [tag.strip() for tag in label.split(",")] if "," in label else [label]


def _format_size(size_bytes: int) -> str:
    if size_bytes >= 1024**3:
        return f"{size_bytes / (1024**3):.2f} GB"
    if size_bytes >= 1024**2:
        return f"{size_bytes / (1024**2):.2f} MB"
    if size_bytes >= 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes} B"


def _html_to_text(content: str) -> str:
    parser = TextExtractor()
    parser.feed(content)
    return parser.get_text()


class WikiBookService:
    def __init__(self):
        self.db_path = DB_PATH
        os.makedirs(BOOKS_DIR, exist_ok=True)
        self.ensure_tables()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def ensure_tables(self) -> None:
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS wiki_books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                difficulty TEXT NOT NULL DEFAULT 'beginner',
                file_name TEXT NOT NULL,
                file_format TEXT NOT NULL,
                size_bytes INTEGER DEFAULT 0,
                custom_badge_label TEXT NOT NULL DEFAULT 'general',
                custom_badge_color TEXT NOT NULL DEFAULT '#00ff88',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS wiki_book_annotations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id INTEGER NOT NULL,
                user_id TEXT NOT NULL,
                user_label TEXT DEFAULT 'Reader',
                annotation_type TEXT NOT NULL,
                page_number INTEGER NOT NULL DEFAULT 1,
                selected_text TEXT DEFAULT '',
                note TEXT DEFAULT '',
                color TEXT DEFAULT '#fbbf24',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(book_id) REFERENCES wiki_books(id)
            )
            """
        )

        cursor.execute("SELECT COUNT(*) FROM wiki_books")
        total = cursor.fetchone()[0]

        if total == 0:
            cursor.executemany(
                """
                INSERT INTO wiki_books (
                    title,
                    author,
                    difficulty,
                    file_name,
                    file_format,
                    size_bytes,
                    custom_badge_label,
                    custom_badge_color
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        book["title"],
                        book["author"],
                        _normalize_difficulty(book["difficulty"]),
                        book["file_name"],
                        _file_format(book["file_name"]),
                        self._get_file_size(book["file_name"]),
                        book["custom_badge_label"],
                        _normalize_hex_color(book["custom_badge_color"]),
                    )
                    for book in SEED_BOOKS
                ],
            )

        conn.commit()
        conn.close()
        self.sync_file_sizes()

    def _resolve_book_path(self, file_name: str) -> str:
        base_dir = os.path.abspath(BOOKS_DIR)
        safe_path = os.path.abspath(os.path.join(base_dir, file_name))
        # Garante que o arquivo resolvido esta realmente dentro do diretorio de livros e previne Path Traversal
        if not safe_path.startswith(base_dir + os.sep) and safe_path != base_dir:
            raise ValueError("Caminho de livro invalido")
        return safe_path

    def _get_file_size(self, file_name: str) -> int:
        path = self._resolve_book_path(file_name)
        return os.path.getsize(path) if os.path.exists(path) else 0

    def sync_file_sizes(self) -> None:
        conn = self._get_connection()
        rows = conn.execute("SELECT id, file_name FROM wiki_books").fetchall()
        for row in rows:
            conn.execute(
                "UPDATE wiki_books SET size_bytes=?, file_format=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (self._get_file_size(row["file_name"]), _file_format(row["file_name"]), row["id"]),
            )
        conn.commit()
        conn.close()

    def get_books(self) -> List[Dict[str, Any]]:
        self.sync_file_sizes()
        conn = self._get_connection()
        rows = conn.execute(
            """
            SELECT
                id,
                title,
                author,
                difficulty,
                file_name,
                file_format,
                size_bytes,
                custom_badge_label,
                custom_badge_color,
                created_at,
                updated_at
            FROM wiki_books
            ORDER BY id DESC
            """
        ).fetchall()
        conn.close()
        return [self._serialize_book(row) for row in rows]

    def get_book(self, book_id: int) -> Optional[Dict[str, Any]]:
        self.sync_file_sizes()
        conn = self._get_connection()
        row = conn.execute("SELECT * FROM wiki_books WHERE id=?", (book_id,)).fetchone()
        conn.close()
        return self._serialize_book(row) if row else None

    def get_book_file_path(self, book_id: int) -> Optional[str]:
        book = self.get_book(book_id)
        if not book:
            return None
        path = self._resolve_book_path(book["fileName"])
        return path if os.path.exists(path) else None

    def get_book_content(self, book_id: int) -> Optional[Dict[str, Any]]:
        book = self.get_book(book_id)
        if not book:
            return None

        path = self._resolve_book_path(book["fileName"])
        if not os.path.exists(path):
            return {
                "book": book,
                "renderType": "missing",
                "content": "",
                "plainText": "",
                "chapters": [],
            }

        fmt = book["fileFormat"].lower()

        if fmt == "pdf":
            return {
                "book": book,
                "renderType": "pdf",
                "content": "",
                "plainText": "",
                "fileUrl": f"/api/wiki/books/{book_id}/file",
                "chapters": [{"title": "PDF", "pageNumber": 1}],
            }

        if fmt in {"md", "markdown"}:
            content = self._read_text_file(path)
            return {
                "book": book,
                "renderType": "text",
                "content": content,
                "plainText": self._markdown_to_text(content),
                "chapters": self._chapters_from_markdown(content),
            }

        if fmt in {"html", "htm"}:
            content = self._read_text_file(path)
            return {
                "book": book,
                "renderType": "html",
                "content": content,
                "plainText": _html_to_text(content),
                "chapters": self._chapters_from_html(content),
            }

        if fmt == "docx":
            text = self._docx_to_text(path)
            return {
                "book": book,
                "renderType": "text",
                "content": text,
                "plainText": text,
                "chapters": self._chapters_from_plain_text(text),
            }

        if fmt == "epub":
            html_content = self._epub_to_html(path)
            return {
                "book": book,
                "renderType": "html",
                "content": html_content,
                "plainText": _html_to_text(html_content),
                "chapters": self._chapters_from_html(html_content),
            }

        return {
            "book": book,
            "renderType": "unsupported",
            "content": "",
            "plainText": "",
            "chapters": [],
        }

    def get_annotations(self, book_id: int, user_id: str = "", scope: str = "mine") -> List[Dict[str, Any]]:
        conn = self._get_connection()
        if scope == "all":
            rows = conn.execute(
                "SELECT * FROM wiki_book_annotations WHERE book_id=? ORDER BY page_number ASC, created_at DESC",
                (book_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT * FROM wiki_book_annotations
                WHERE book_id=? AND user_id=?
                ORDER BY page_number ASC, created_at DESC
                """,
                (book_id, user_id),
            ).fetchall()
        conn.close()
        return [self._serialize_annotation(row, user_id) for row in rows]

    def add_annotation(self, book_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        user_id = str(payload.get("userId") or "").strip()[:120] or "anonymous"
        user_label = str(payload.get("userLabel") or "Reader").strip()[:80] or "Reader"
        annotation_type = _normalize_annotation_type(str(payload.get("annotationType") or "comment"))
        page_number = max(1, int(payload.get("pageNumber") or 1))
        selected_text = str(payload.get("selectedText") or "").strip()[:1200]
        note = str(payload.get("note") or "").strip()[:2000]
        color = _normalize_hex_color(str(payload.get("color") or "#fbbf24"))

        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO wiki_book_annotations (
                book_id,
                user_id,
                user_label,
                annotation_type,
                page_number,
                selected_text,
                note,
                color
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (book_id, user_id, user_label, annotation_type, page_number, selected_text, note, color),
        )
        annotation_id = cursor.lastrowid
        conn.commit()
        row = conn.execute("SELECT * FROM wiki_book_annotations WHERE id=?", (annotation_id,)).fetchone()
        conn.close()
        return self._serialize_annotation(row, user_id)

    def delete_annotation(self, annotation_id: int, user_id: str) -> bool:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM wiki_book_annotations WHERE id=? AND user_id=?", (annotation_id, user_id))
        changed = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return changed

    def _serialize_book(self, row: sqlite3.Row) -> Dict[str, Any]:
        size_bytes = int(row["size_bytes"] or 0)
        return {
            "id": row["id"],
            "title": row["title"],
            "author": row["author"],
            "difficulty": _normalize_difficulty(row["difficulty"]),
            "fileName": row["file_name"],
            "fileFormat": row["file_format"],
            "sizeBytes": size_bytes,
            "sizeLabel": _format_size(size_bytes),
            "customBadgeLabel": _parse_custom_badge_label(row["custom_badge_label"]),
            "customBadgeColor": _normalize_hex_color(row["custom_badge_color"]),
            "downloadUrl": f"/api/wiki/books/{row['id']}/download",
            "fileUrl": f"/api/wiki/books/{row['id']}/file",
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }

    def _serialize_annotation(self, row: sqlite3.Row, viewer_id: str = "") -> Dict[str, Any]:
        return {
            "id": row["id"],
            "bookId": row["book_id"],
            "userId": row["user_id"],
            "userLabel": row["user_label"],
            "annotationType": row["annotation_type"],
            "pageNumber": row["page_number"],
            "selectedText": row["selected_text"],
            "note": row["note"],
            "color": _normalize_hex_color(row["color"]),
            "createdAt": row["created_at"],
            "mine": bool(viewer_id and row["user_id"] == viewer_id),
        }

    def _read_text_file(self, path: str) -> str:
        with open(path, "r", encoding="utf-8", errors="ignore") as file:
            return file.read()

    def _markdown_to_text(self, content: str) -> str:
        content = re.sub(r"```[\s\S]*?```", "", content)
        content = re.sub(r"`([^`]+)`", r"\1", content)
        content = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", content)
        content = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", content)
        content = re.sub(r"^#{1,6}\s*", "", content, flags=re.MULTILINE)
        content = re.sub(r"^\s*[-*+]\s+", "- ", content, flags=re.MULTILINE)
        return html.unescape(content).strip()

    def _docx_to_text(self, path: str) -> str:
        with zipfile.ZipFile(path) as docx:
            info = docx.getinfo("word/document.xml")
            if info.file_size > 25 * 1024 * 1024:
                return "Erro de Segurança: Tamanho descompactado muito grande."
            xml = docx.read("word/document.xml")
        root = ElementTree.fromstring(xml)
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        paragraphs = []
        for paragraph in root.findall(".//w:p", ns):
            parts = [node.text for node in paragraph.findall(".//w:t", ns) if node.text]
            if parts:
                paragraphs.append("".join(parts))
        return "\n\n".join(paragraphs)

    def _epub_to_html(self, path: str) -> str:
        pieces = []
        with zipfile.ZipFile(path) as epub:
            names = [
                name
                for name in epub.namelist()
                if name.lower().endswith((".xhtml", ".html", ".htm"))
                and "nav" not in name.lower()
                and "toc" not in name.lower()
            ]
            for name in names:
                info = epub.getinfo(name)
                if info.file_size > 25 * 1024 * 1024:
                    continue # Prevenção de Zip Bomb
                content = epub.read(name).decode("utf-8", errors="ignore")
                content = re.sub(r"<script[\s\S]*?</script>", "", content, flags=re.IGNORECASE)
                pieces.append(content)
        return "\n".join(pieces)

    def _chapters_from_markdown(self, content: str) -> List[Dict[str, Any]]:
        chapters = []
        for match in re.finditer(r"^(#{1,3})\s+(.+)$", content, flags=re.MULTILINE):
            chapters.append({"title": match.group(2).strip(), "offset": match.start()})
        return chapters or [{"title": "Inicio", "offset": 0}]

    def _chapters_from_html(self, content: str) -> List[Dict[str, Any]]:
        chapters = []
        for match in re.finditer(r"<h[1-3][^>]*>(.*?)</h[1-3]>", content, flags=re.IGNORECASE | re.DOTALL):
            title = re.sub(r"<[^>]+>", "", match.group(1)).strip()
            if title:
                chapters.append({"title": html.unescape(title), "offset": match.start()})
        return chapters or [{"title": "Inicio", "offset": 0}]

    def _chapters_from_plain_text(self, content: str) -> List[Dict[str, Any]]:
        chapters = []
        for match in re.finditer(r"^(.{4,80})$", content, flags=re.MULTILINE):
            title = match.group(1).strip()
            if title and title.upper() == title:
                chapters.append({"title": title.title(), "offset": match.start()})
        return chapters[:20] or [{"title": "Inicio", "offset": 0}]
