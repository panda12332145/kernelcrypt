import json
import os
import re
import sqlite3
from typing import Any, Dict, List

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "..",
    "databases",
    "portfolio.db",
)

DIFFICULTIES = {"beginner", "intermediate", "advanced"}
CONTENT_TYPES = {"Video", "Playlist"}
HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

SEED_VIDEOS = [
    {
        "title": "Assembly x86-64 Basics - Complete Course",
        "video_url": "https://www.youtube.com/playlist?list=PL9o2C-4xGfjHl5PF-Xt-yWH2zc4wjJ3AW",
        "cover_url": "https://img.youtube.com/vi/PxiMLtsuGO0/maxresdefault.jpg",
        "difficulty": "beginner",
        "duration": "4h 20min",
        "content_type": "Playlist",
        "custom_badge_label": "reverse engineering",
        "custom_badge_color": "#00ff88",
    },
    {
        "title": "Python Malware Analysis",
        "video_url": "https://www.youtube.com/watch?v=qwAFL1597eM",
        "cover_url": "https://img.youtube.com/vi/qwAFL1597eM/maxresdefault.jpg",
        "difficulty": "advanced",
        "duration": "2h 13min",
        "content_type": "Video",
        "custom_badge_label": "malware",
        "custom_badge_color": "#ef4444",
    },
    {
        "title": "SQL Injection Full Course",
        "video_url": "https://www.youtube.com/watch?v=2OPVViV-GQk",
        "cover_url": "https://img.youtube.com/vi/2OPVViV-GQk/maxresdefault.jpg",
        "difficulty": "intermediate",
        "duration": "2h 45min",
        "content_type": "Video",
        "custom_badge_label": "pentest web",
        "custom_badge_color": "#38bdf8",
    },
]


def _normalize_difficulty(value: str) -> str:
    difficulty = (value or "").strip().lower()
    return difficulty if difficulty in DIFFICULTIES else "beginner"


def _normalize_content_type(value: str) -> str:
    content_type = (value or "").strip().lower()
    return "Playlist" if content_type == "playlist" else "Video"


def _normalize_hex_color(value: str) -> str:
    color = (value or "").strip()
    return color if HEX_COLOR_RE.match(color) else "#00ff88"


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


class WikiVideoService:
    def __init__(self):
        self.db_path = DB_PATH
        self.ensure_table()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def ensure_table(self) -> None:
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS wiki_videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                video_url TEXT NOT NULL,
                cover_url TEXT NOT NULL,
                difficulty TEXT NOT NULL DEFAULT 'beginner',
                duration TEXT NOT NULL DEFAULT '0min',
                content_type TEXT NOT NULL DEFAULT 'Video',
                custom_badge_label TEXT NOT NULL DEFAULT 'general',
                custom_badge_color TEXT NOT NULL DEFAULT '#00ff88',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        cursor.execute("SELECT COUNT(*) FROM wiki_videos")
        total = cursor.fetchone()[0]

        if total == 0:
            cursor.executemany(
                """
                INSERT INTO wiki_videos (
                    title,
                    video_url,
                    cover_url,
                    difficulty,
                    duration,
                    content_type,
                    custom_badge_label,
                    custom_badge_color
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        video["title"],
                        video["video_url"],
                        video["cover_url"],
                        _normalize_difficulty(video["difficulty"]),
                        video["duration"],
                        _normalize_content_type(video["content_type"]),
                        video["custom_badge_label"],
                        _normalize_hex_color(video["custom_badge_color"]),
                    )
                    for video in SEED_VIDEOS
                ],
            )

        conn.commit()
        conn.close()

    def get_videos(self) -> List[Dict[str, Any]]:
        try:
            conn = self._get_connection()
            rows = conn.execute(
                """
                SELECT
                    id,
                    title,
                    video_url,
                    cover_url,
                    difficulty,
                    duration,
                    content_type,
                    custom_badge_label,
                    custom_badge_color,
                    created_at,
                    updated_at
                FROM wiki_videos
                ORDER BY id DESC
                """
            ).fetchall()
            conn.close()

            return [self._serialize(row) for row in rows]

        except Exception as e:
            print(f"Erro ao buscar wiki videos: {e}")
            return []

    def _serialize(self, row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "title": row["title"],
            "videoUrl": row["video_url"],
            "coverUrl": row["cover_url"],
            "difficulty": _normalize_difficulty(row["difficulty"]),
            "duration": row["duration"],
            "contentType": _normalize_content_type(row["content_type"]),
            "customBadgeLabel": _parse_custom_badge_label(row["custom_badge_label"]),
            "customBadgeColor": _normalize_hex_color(row["custom_badge_color"]),
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }
