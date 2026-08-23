import os
import re
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "portfolio.db")
HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

VIDEOS = [
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


def normalize_difficulty(value):
    value = (value or "").strip().lower()
    return value if value in {"beginner", "intermediate", "advanced"} else "beginner"


def normalize_content_type(value):
    value = (value or "").strip().lower()
    return "Playlist" if value == "playlist" else "Video"


def normalize_hex(value):
    value = (value or "").strip()
    return value if HEX_COLOR_RE.match(value) else "#00ff88"


conn = sqlite3.connect(DB_PATH)
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

cursor.execute("DELETE FROM wiki_videos")

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
            normalize_difficulty(video["difficulty"]),
            video["duration"],
            normalize_content_type(video["content_type"]),
            video["custom_badge_label"],
            normalize_hex(video["custom_badge_color"]),
        )
        for video in VIDEOS
    ],
)

conn.commit()
conn.close()

print("Tabela wiki_videos criada/populada com sucesso.")
