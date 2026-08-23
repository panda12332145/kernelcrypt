"""
DEV MANAGER - FULLSTACK + CLOUDFLARE + DISCORD
==============================================

FUNÇÕES:
---------
- Inicia Backend FastAPI
- Inicia Backend Node da Wiki Markdown/GitHub
- Inicia Frontend Vite React
- Inicia Tunnel Cloudflare
- Verifica status das APIs
- Envia webhook para Discord
- Monitora processos
- Finaliza tudo corretamente

REQUISITOS:
-------------
pip install requests colorama

Também precisa:
- Node.js
- cloudflared.exe

ESTRUTURA:
-----------
base/
│
├── dev_man.py
├── cloudflared.exe
├── package.json
├── vite.config.ts
├── src/
│
└── backend/
    ├── backend_server.py
    └── requirements.txt
"""

import os
import re
import sys
import time
import signal
import socket
import requests
import subprocess

from pathlib import Path
from colorama import init, Fore, Style

# =========================================================
# COLORAMA
# =========================================================
init(autoreset=True)

# =========================================================
# WINDOWS FLAGS
# =========================================================
CREATE_NO_WINDOW = 0x08000000 if os.name == "nt" else 0

# =========================================================
# BASE PATHS
# =========================================================
BASE_DIR = Path(__file__).parent.resolve()

# FRONTEND
FRONTEND_DIR = BASE_DIR

# BACKEND
BACKEND_DIR = BASE_DIR / "backend"

BACKEND_FILE = BACKEND_DIR / "backend_server.py"

# GITHUB MARKDOWN WIKI BACKEND
WIKI_BACKEND_DIR = BASE_DIR / "server"

# CLOUDFLARE
CLOUDFLARED = BASE_DIR / "cloudflared.exe"

# LOG
LOG_FILE = BASE_DIR / "cloudflare.log"

# =========================================================

# CLOUDFLARE
CLOUDFLARED = BASE_DIR / "cloudflared.exe"

# LOG
LOG_FILE = BASE_DIR / "cloudflare.log"

# =========================================================
# PORTS
# =========================================================
BACKEND_PORT = 8000
WIKI_BACKEND_PORT = 3001
FRONTEND_PORT = 5173

# =========================================================
# DISCORD WEBHOOK
# =========================================================
WEBHOOK_URL = ""

# =========================================================
# PROCESS STORAGE
# =========================================================
backend_process = None
wiki_backend_process = None
frontend_process = None
tunnel_process = None

# =========================================================
# TERMINAL COLORS
# =========================================================
def info(msg):
    print(f"{Fore.CYAN}[INFO]{Style.RESET_ALL} {msg}")

def ok(msg):
    print(f"{Fore.GREEN}[OK]{Style.RESET_ALL} {msg}")

def warn(msg):
    print(f"{Fore.YELLOW}[WARN]{Style.RESET_ALL} {msg}")

def error(msg):
    print(f"{Fore.RED}[ERROR]{Style.RESET_ALL} {msg}")

# =========================================================
# CHECK FILES
# =========================================================
def ensure_exists(path, name):

    if not path.exists():

        error(f"{name} não encontrado:")
        print(path)

        shutdown()

# =========================================================
# WAIT PORT
# =========================================================
def wait_port(port, timeout=60):

    info(f"Aguardando porta {port}...")

    start = time.time()

    while time.time() - start < timeout:

        s = socket.socket()

        try:

            s.settimeout(2)

            s.connect(("127.0.0.1", port))

            s.close()

            ok(f"Porta {port} ONLINE")

            return True

        except:
            time.sleep(1)

    return False

# =========================================================
# CHECK API
# =========================================================
def check_api(url):

    try:

        r = requests.get(url, timeout=10)

        return {
            "online": True,
            "status_code": r.status_code,
            "text": r.text[:300]
        }

    except Exception as e:

        return {
            "online": False,
            "error": str(e)
        }

# =========================================================
# START BACKEND
# =========================================================
def start_backend():

    global backend_process

    info("Iniciando backend...")

    backend_process = subprocess.Popen(
        [
            sys.executable,
            str(BACKEND_FILE)
        ],
        cwd=str(BACKEND_DIR)
    )

    return backend_process

# =========================================================
# START GITHUB WIKI BACKEND
# =========================================================
def start_wiki_backend():

    global wiki_backend_process

    info("Iniciando backend da Wiki Markdown/GitHub...")

    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    npx_cmd = "npx.cmd" if os.name == "nt" else "npx"

    if not (WIKI_BACKEND_DIR / "node_modules").exists():

        info("Instalando dependências do backend da Wiki...")

        install = subprocess.run(
            [
                npm_cmd,
                "install"
            ],
            cwd=str(WIKI_BACKEND_DIR)
        )

        if install.returncode != 0:

            error("Falha ao instalar dependências do backend da Wiki.")

            shutdown()

    db_push = subprocess.run(
        [
            npx_cmd,
            "prisma",
            "db",
            "push"
        ],
        cwd=str(WIKI_BACKEND_DIR)
    )

    if db_push.returncode != 0:

        error("Falha ao preparar banco Prisma da Wiki.")

        shutdown()

    build = subprocess.run(
        [
            npm_cmd,
            "run",
            "build"
        ],
        cwd=str(WIKI_BACKEND_DIR)
    )

    if build.returncode != 0:

        error("Falha ao compilar backend da Wiki.")

        shutdown()

    wiki_backend_process = subprocess.Popen(
        [
            npm_cmd,
            "start"
        ],
        cwd=str(WIKI_BACKEND_DIR)
    )

    return wiki_backend_process

# =========================================================
# START FRONTEND
# =========================================================
def start_frontend():

    global frontend_process

    info("Iniciando frontend...")

    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"

    frontend_process = subprocess.Popen(
        [
            npm_cmd,
            "run",
            "dev"
        ],
        cwd=str(FRONTEND_DIR)
    )

    return frontend_process

# =========================================================
def send_webhook(
    public_link,
    backend_status,
    wiki_backend_status,
    frontend_status
):

    if not WEBHOOK_URL.strip():

        warn("Webhook não configurada.")

        return

    payload = {
        "username": "DEV MANAGER",
        "embeds": [
            {
                "title": "🚀 FULLSTACK ONLINE",
                "description": (
                    "Sistema iniciado com sucesso."
                ),
                "color": 65280,
                "fields": [
                    {
                        "name": "🌐 Frontend Público",
                        "value": public_link,
                        "inline": False
                    },
                    {
                        "name": "🖥 Frontend Local",
                        "value": (
                            f"http://localhost:{FRONTEND_PORT}"
                        ),
                        "inline": False
                    },
                    {
                        "name": "⚙ Backend Local",
                        "value": (
                            f"http://localhost:{BACKEND_PORT}"
                        ),
                        "inline": False
                    },
                    {
                        "name": "📚 Wiki Markdown Local",
                        "value": (
                            f"http://localhost:{WIKI_BACKEND_PORT}"
                        ),
                        "inline": False
                    },
                    {
                        "name": "📡 Backend Status",
                        "value": (
                            "ONLINE"
                            if backend_status["online"]
                            else "OFFLINE"
                        ),
                        "inline": True
                    },
                    {
                        "name": "📖 Wiki Status",
                        "value": (
                            "ONLINE"
                            if wiki_backend_status["online"]
                            else "OFFLINE"
                        ),
                        "inline": True
                    },
                    {
                        "name": "🎨 Frontend Status",
                        "value": (
                            "ONLINE"
                            "ONLINE"
                            if frontend_status["online"]
                            else "OFFLINE"
                        ),
                        "inline": True
                    }
                ],
                "footer": {
                    "text": "Unified Dev Manager"
                }
            }
        ]
    }

    try:

        requests.post(
            WEBHOOK_URL,
            json=payload,
            timeout=10
        )

        ok("Webhook enviada.")

    except Exception as e:

        error(f"Erro webhook: {e}")


# =========================================================
# MONITOR
# =========================================================
def monitor():

    global backend_process
    global wiki_backend_process
    global frontend_process

    info("Monitorando processos...")

    while True:

        if backend_process.poll() is not None:

            error("Backend fechou.")

            shutdown()

        if frontend_process.poll() is not None:

            error("Frontend fechou.")

            shutdown()

        if wiki_backend_process.poll() is not None:

            error("Backend da Wiki Markdown/GitHub fechou.")

            shutdown()

        time.sleep(2)

# =========================================================
# SHUTDOWN
# =========================================================
def shutdown(*args):

    global backend_process
    global wiki_backend_process
    global frontend_process

    warn("Finalizando processos...")

    processes = [
        backend_process,
        wiki_backend_process,
        frontend_process
    ]

    for proc in processes:
        try:
            if proc and proc.poll() is None:
                proc.terminate()
        except:
            pass

    ok("Tudo finalizado.")
    os._exit(0)

# =========================================================
# MAIN
# =========================================================
def main():

    signal.signal(signal.SIGINT, shutdown)

    print()
    print("=" * 60)
    print("UNIFIED FULLSTACK DEV MANAGER")
    print("=" * 60)
    print()

    # =====================================================
    # VALIDATE FILES
    # =====================================================
    ensure_exists(
        FRONTEND_DIR / "package.json",
        "Frontend package.json"
    )

    ensure_exists(
        BACKEND_FILE,
        "Backend"
    )

    ensure_exists(
        WIKI_BACKEND_DIR / "package.json",
        "Backend da Wiki Markdown/GitHub"
    )

    # =====================================================
    # START BACKEND
    # =====================================================
    start_backend()

    if not wait_port(BACKEND_PORT):
        error("Backend não iniciou.")

        shutdown()

    # =====================================================
    # START GITHUB WIKI BACKEND
    # =====================================================
    start_wiki_backend()

    if not wait_port(WIKI_BACKEND_PORT):

        error("Backend da Wiki Markdown/GitHub não iniciou.")

        shutdown()

    # =====================================================
    # START FRONTEND
    # =====================================================
    start_frontend()

    if not wait_port(FRONTEND_PORT):

        error("Frontend não iniciou.")

        shutdown()

    # =====================================================
    # CHECK STATUS
    # =====================================================
    backend_status = check_api(
        f"http://127.0.0.1:{BACKEND_PORT}"
    )

    wiki_backend_status = check_api(
        f"http://127.0.0.1:{WIKI_BACKEND_PORT}/health"
    )

    frontend_status = check_api(
        f"http://127.0.0.1:{FRONTEND_PORT}"
    )

    # =====================================================
    # TERMINAL INFO
    # =====================================================
    print()
    print("=" * 60)

    ok("SISTEMA ONLINE")

    print()
    print(f"{Fore.GREEN}BACKEND:{Style.RESET_ALL}")
    print(f"  http://localhost:{BACKEND_PORT}")

    print()
    print(f"{Fore.GREEN}GITHUB WIKI BACKEND:{Style.RESET_ALL}")
    print(f"  http://localhost:{WIKI_BACKEND_PORT}")

    print()
    print(f"{Fore.GREEN}FRONTEND:{Style.RESET_ALL}")
    print(f"  http://localhost:{FRONTEND_PORT}")

    print("=" * 60)
    print()

    # =====================================================
    # MONITOR
    # =====================================================
    monitor()

# =========================================================
# ENTRY
# =========================================================
if __name__ == "__main__":
    main()
