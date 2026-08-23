"""
SEED ABOUT DATABASE
========================================================

Cria a tabela 'about' no portfolio.db e popula com os
dados do perfil (terminalCard / about.json).

EXECUTAR:
python seed_about.py
"""

import sqlite3
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = os.path.join(os.path.dirname(__file__), "portfolio.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# =========================================================
# CRIAR TABELA
# =========================================================

cursor.execute("""
CREATE TABLE IF NOT EXISTS about (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,
    alias TEXT,
    role TEXT,

    -- Formação acadêmica (JSON)
    education TEXT DEFAULT '{}',

    -- Stack (JSON: { backend: [...], low_level: [...], ... })
    stack TEXT DEFAULT '{}',

    -- Arrays (JSON)
    focus TEXT DEFAULT '[]',
    languages TEXT DEFAULT '[]',
    specialties TEXT DEFAULT '[]',

    scale TEXT,
    fun_fact TEXT,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

conn.commit()
print("✅ Tabela 'about' criada com sucesso.")

# =========================================================
# SEED DATA
# =========================================================

ABOUT = {
    "name": "Athos Dã",
    "alias": "X86BinaryGhost",
    "role": "Cybersecurity Researcher | Reverse Engineer | Systems Developer",
    "education": {
        "undergraduate": {
            "degree": "Análise e Desenvolvimento de Sistemas (ADS)",
            "institution": "Estácio"
        },
        "postgraduate": {
            "degree": "Pós-graduação em Cibersegurança",
            "institution": "Estácio"
        }
    },
    "stack": {
        "backend": ["Python", "FastAPI", "Node.js", "Redis", "PostgreSQL", "MySQL"],
        "low_level": ["C", "C++", "Assembly x86/x64", "Linux Internals", "Windows Internals", "Linux Kernel"],
        "security": ["Reverse Engineering", "Malware Analysis", "OSINT", "Red Team", "Pentesting", "Cryptography", "Threat Intelligence", "Network Security"],
        "realtime": ["FFmpeg", "WebRTC", "GPU Streaming", "Socket Programming", "Realtime Networking"],
        "devops": ["Docker", "Linux", "Git", "Virtualization", "CI/CD"]
    },
    "focus": [
        "cybersecurity research", "reverse engineering", "malware analysis",
        "ethical hacking", "network security", "distributed systems",
        "cryptography", "low-level programming", "linux systems",
        "kernel research", "real-time systems", "backend engineering",
        "AI systems", "automation", "protocol engineering",
        "threat intelligence", "offensive security", "theoretical physics"
    ],
    "languages": [
        "Python", "C", "C++", "Assembly x86-64", "JavaScript",
        "ShellScript", "PowerShell", "Lua", "Ruby"
    ],
    "specialties": [
        "Malware Analysis", "Reverse Engineering", "Threat Research",
        "Linux Systems", "Offensive Security", "Protocol Engineering",
        "Automation", "CTF Challenges", "Network Analysis",
        "Hardware Hacking", "Threat Intelligence", "Kernel Research",
        "Distributed Architectures"
    ],
    "scale": "high-performance systems, cybersecurity research & low-level engineering",
    "fun_fact": "Passionate about cybersecurity, Linux systems, astronomy, philosophy, Beethoven, reverse engineering, and theoretical physics."
}

# Limpa registro existente
cursor.execute("DELETE FROM about")

cursor.execute("""
INSERT INTO about (
    name, alias, role,
    education, stack, focus, languages, specialties,
    scale, fun_fact
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    ABOUT["name"],
    ABOUT["alias"],
    ABOUT["role"],
    json.dumps(ABOUT["education"], ensure_ascii=False),
    json.dumps(ABOUT["stack"], ensure_ascii=False),
    json.dumps(ABOUT["focus"], ensure_ascii=False),
    json.dumps(ABOUT["languages"], ensure_ascii=False),
    json.dumps(ABOUT["specialties"], ensure_ascii=False),
    ABOUT["scale"],
    ABOUT["fun_fact"],
))

conn.commit()
conn.close()

print("✅ Dados do 'about' inseridos no banco com sucesso.")
print(f"📁 DB: {DB_PATH}")
