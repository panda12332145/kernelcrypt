import os
import json
import sqlite3
from fastapi import APIRouter

router = APIRouter(prefix="/api/stats", tags=["stats"])

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "databases", "dashboard.db"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def parse_row(row):
    """Convert sqlite3.Row to dict and parse JSON fields"""
    d = dict(row)
    for k, v in list(d.items()):
        if k.endswith('_json') and v:
            try:
                d[k.replace('_json', '')] = json.loads(v)
            except:
                pass
            del d[k]
    return d

@router.get("/tryhackme")
async def get_thm():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tryhackme_data LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"error": "Data not found or not seeded yet."}
    return parse_row(row)

@router.get("/leetcode")
async def get_lc():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM leetcode_data LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"error": "Data not found or not seeded yet."}
    return parse_row(row)

@router.get("/youtube")
async def get_yt():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM youtube_data LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"error": "Data not found or not seeded yet."}
    return parse_row(row)

@router.get("/instagram")
async def get_ig():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM instagram_data LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"error": "Data not found or not seeded yet."}
    return parse_row(row)
