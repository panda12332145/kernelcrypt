"""
SEED PROJECTS DATABASE
========================================================

Cria a tabela 'projects' no portfolio.db e popula
com os 9 projetos existentes do portfolioData.ts.

EXECUTAR:
python seed_projects.py
"""

import sqlite3
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

# =========================================================
# DATABASE
# =========================================================

DB_PATH = os.path.join(os.path.dirname(__file__), "portfolio.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# =========================================================
# CRIAR TABELA
# =========================================================

cursor.execute("""
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    nome TEXT,
    aviso TEXT,
    aviso_cor TEXT,

    descricao TEXT,

    estrelas TEXT,
    commits TEXT,
    downloads TEXT,

    linguagens TEXT,
    tags TEXT,
    frameworks TEXT,

    team_type TEXT,
    tipo TEXT,
    customizado TEXT,

    link TEXT,
    weblink TEXT,
    icone TEXT,

    emoji TEXT,
    featured INTEGER DEFAULT 0
)
""")

conn.commit()

print("✅ Tabela 'projects' criada com sucesso.")

# =========================================================
# SEED DATA
# =========================================================

PROJECTS = [
    {
        "nome": "ShadowNet Malware Research Lab",
        "aviso": None,
        "aviso_cor": None,
        "descricao": "Cybersecurity research laboratory focused on malware analysis, reverse engineering, persistence techniques, sandbox evasion, encrypted communications, memory inspection, Windows internals and threat intelligence for educational and authorized security research.",
        "estrelas": "980",
        "commits": "412",
        "downloads": "240K+",
        "linguagens": json.dumps(["Python", "C++", "Assembly"]),
        "tags": json.dumps(["cybersecurity", "reverse-engineering", "malware-analysis", "threat-intelligence", "windows-internals", "network-security"]),
        "frameworks": None,
        "team_type": "Red Team",
        "tipo": None,
        "customizado": json.dumps(["Reverse Engineering", "Malware Analysis", "Threat Research", "Python", "C++"]),
        "link": "https://github.com/panda12332145/shadownet",
        "weblink": None,
        "icone": None,
        "emoji": "🛡️",
        "featured": 1,
    },
    {
        "nome": "PyC2 Research Framework",
        "aviso": None,
        "aviso_cor": None,
        "descricao": "Distributed command-and-control research framework built for authorized security simulations, red team exercises, encrypted communications, distributed testing and protocol engineering.",
        "estrelas": "540",
        "commits": "267",
        "downloads": None,
        "linguagens": json.dumps(["Python", "C"]),
        "tags": json.dumps(["security-research", "c2-framework", "red-team", "cryptography", "protocol-engineering"]),
        "frameworks": None,
        "team_type": "Red Team",
        "tipo": None,
        "customizado": json.dumps(["Security Research", "Red Team", "Protocol Engineering", "Cryptography"]),
        "link": "https://github.com/panda12332145/pyc2",
        "weblink": None,
        "icone": None,
        "emoji": "💀",
        "featured": 1,
    },
    {
        "nome": "Realtime Streaming Engine",
        "aviso": None,
        "aviso_cor": None,
        "descricao": "GPU accelerated low-latency real-time streaming infrastructure using FFmpeg, multiprocessing pipelines, distributed media processing, WebRTC communication and realtime networking.",
        "estrelas": "320",
        "commits": "411",
        "downloads": None,
        "linguagens": json.dumps(["Python", "C++"]),
        "tags": json.dumps(["webrtc", "streaming", "ffmpeg", "distributed-systems", "gpu-streaming"]),
        "frameworks": None,
        "team_type": None,
        "tipo": None,
        "customizado": json.dumps(["WebRTC", "GPU Streaming", "FFmpeg", "Distributed Systems"]),
        "link": "https://github.com/panda12332145/realtime-streaming-engine",
        "weblink": None,
        "icone": None,
        "emoji": "📡",
        "featured": 1,
    },
    {
        "nome": "Kernel Research Toolkit",
        "aviso": None,
        "aviso_cor": None,
        "descricao": "Linux kernel experimentation toolkit focused on syscall tracing, memory inspection, debugging, low-level system interaction, process analysis and performance optimization.",
        "estrelas": "214",
        "commits": "173",
        "downloads": None,
        "linguagens": json.dumps(["C", "Assembly x86-64"]),
        "tags": json.dumps(["linux", "kernel", "low-level", "systems-programming", "debugging"]),
        "frameworks": None,
        "team_type": None,
        "tipo": None,
        "customizado": json.dumps(["Linux Kernel", "Assembly", "Low-Level"]),
        "link": "https://github.com/panda12332145/kernel-research-toolkit",
        "weblink": None,
        "icone": None,
        "emoji": "⚙️",
        "featured": 0,
    },
    {
        "nome": "Cryptography Laboratory",
        "aviso": None,
        "aviso_cor": None,
        "descricao": "Collection of cryptographic implementations, hashing systems, encryption experiments, secure communication protocols and algorithm research projects.",
        "estrelas": "180",
        "commits": "208",
        "downloads": None,
        "linguagens": json.dumps(["Python", "C++"]),
        "tags": json.dumps(["cryptography", "security", "algorithms", "protocols", "encryption"]),
        "frameworks": None,
        "team_type": None,
        "tipo": None,
        "customizado": json.dumps(["Cryptography", "Algorithms", "Security"]),
        "link": "https://github.com/panda12332145/cryptography-lab",
        "weblink": None,
        "icone": None,
        "emoji": "🔐",
        "featured": 0,
    },
    {
        "nome": "FastAPI Distributed Infrastructure",
        "aviso": None,
        "aviso_cor": None,
        "descricao": "Production-grade distributed backend infrastructure using FastAPI, Redis, PostgreSQL, Docker, async workers, websocket communication and scalable microservices.",
        "estrelas": "390",
        "commits": "302",
        "downloads": None,
        "linguagens": json.dumps(["Python"]),
        "tags": json.dumps(["fastapi", "backend", "distributed-systems", "microservices", "websockets"]),
        "frameworks": json.dumps(["FastAPI", "Redis", "PostgreSQL", "Docker"]),
        "team_type": None,
        "tipo": None,
        "customizado": json.dumps(["FastAPI", "Backend", "Distributed Systems", "Microservices"]),
        "link": "https://github.com/panda12332145/distributed-backend",
        "weblink": "https://www.meu-site.com/backend",
        "icone": None,
        "emoji": "🚀",
        "featured": 1,
    },
    {
        "nome": "OSINT Recon Toolkit",
        "aviso": None,
        "aviso_cor": None,
        "descricao": "Open-source intelligence automation toolkit focused on reconnaissance, metadata analysis, public information gathering and threat intelligence workflows.",
        "estrelas": "270",
        "commits": "167",
        "downloads": None,
        "linguagens": json.dumps(["Python"]),
        "tags": json.dumps(["osint", "automation", "reconnaissance", "threat-intelligence", "security"]),
        "frameworks": None,
        "team_type": None,
        "tipo": None,
        "customizado": json.dumps(["OSINT", "Automation", "Threat Intelligence"]),
        "link": "https://github.com/panda12332145/osint-recon-toolkit",
        "weblink": None,
        "icone": None,
        "emoji": "🛰️",
        "featured": 1,
    },
    {
        "nome": "CTF Toolkit",
        "aviso": None,
        "aviso_cor": None,
        "descricao": "Collection of exploit development scripts, binary analysis utilities, reversing tools and notes designed for Capture The Flag competitions and offensive security learning.",
        "estrelas": "350",
        "commits": "231",
        "downloads": None,
        "linguagens": json.dumps(["Python", "C++", "Shell"]),
        "tags": json.dumps(["ctf", "binary-exploitation", "reverse-engineering", "offensive-security"]),
        "frameworks": None,
        "team_type": None,
        "tipo": None,
        "customizado": json.dumps(["CTF", "Binary Exploitation", "Security"]),
        "link": "https://github.com/panda12332145/ctf-toolkit",
        "weblink": None,
        "icone": None,
        "emoji": "🏴",
        "featured": 0,
    },
    {
        "nome": "Neural Bitcoin Predictor",
        "aviso": None,
        "aviso_cor": None,
        "descricao": "Experimental PyTorch project using LSTM neural networks to analyze financial market behavior and predict cryptocurrency trends using real-time data pipelines.",
        "estrelas": "170",
        "commits": "121",
        "downloads": None,
        "linguagens": json.dumps(["Python"]),
        "tags": json.dumps(["pytorch", "machine-learning", "lstm", "finance", "ai"]),
        "frameworks": json.dumps(["PyTorch"]),
        "team_type": None,
        "tipo": None,
        "customizado": json.dumps(["PyTorch", "AI", "LSTM"]),
        "link": "https://github.com/panda12332145/bitcoin-predictor",
        "weblink": None,
        "icone": None,
        "emoji": "🧠",
        "featured": 0,
    },
]

# =========================================================
# INSERT
# =========================================================

# Limpa dados antigos se existirem
cursor.execute("DELETE FROM projects")

for project in PROJECTS:

    cursor.execute("""
    INSERT INTO projects (
        nome, aviso, aviso_cor,
        descricao,
        estrelas, commits, downloads,
        linguagens, tags, frameworks,
        team_type, tipo, customizado,
        link, weblink, icone,
        emoji, featured
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        project["nome"],
        project["aviso"],
        project["aviso_cor"],
        project["descricao"],
        project["estrelas"],
        project["commits"],
        project["downloads"],
        project["linguagens"],
        project["tags"],
        project["frameworks"],
        project["team_type"],
        project["tipo"],
        project["customizado"],
        project["link"],
        project["weblink"],
        project["icone"],
        project["emoji"],
        project["featured"],
    ))

conn.commit()
conn.close()

print(f"✅ {len(PROJECTS)} projetos inseridos no banco.")
print(f"📁 DB: {DB_PATH}")
