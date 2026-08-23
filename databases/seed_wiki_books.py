import os
import re
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "portfolio.db")
BOOKS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "library", "books"))
HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

BOOKS = [
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


def normalize_difficulty(value):
    value = (value or "").strip().lower()
    return value if value in {"beginner", "intermediate", "advanced"} else "beginner"


def normalize_hex(value):
    value = (value or "").strip()
    return value if HEX_COLOR_RE.match(value) else "#00ff88"


def file_format(file_name):
    ext = os.path.splitext(file_name)[1].lower().replace(".", "")
    return "md" if ext == "markdown" else ext


def file_size(file_name):
    path = os.path.abspath(os.path.join(BOOKS_DIR, file_name))
    if not path.startswith(BOOKS_DIR):
        return 0
    return os.path.getsize(path) if os.path.exists(path) else 0


conn = sqlite3.connect(DB_PATH)
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

cursor.execute("DELETE FROM wiki_book_annotations")
cursor.execute("DELETE FROM wiki_books")
cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('wiki_books', 'wiki_book_annotations')")

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
            normalize_difficulty(book["difficulty"]),
            book["file_name"],
            file_format(book["file_name"]),
            file_size(book["file_name"]),
            book["custom_badge_label"],
            normalize_hex(book["custom_badge_color"]),
        )
        for book in BOOKS
    ],
)

conn.commit()
conn.close()

print("Tabela wiki_books criada/populada com sucesso.")
