import sqlite3
import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from app.core.config import GITHUB_USERNAME, GITHUB_TOKEN

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "..",
    "databases",
    "portfolio.db"
)

CACHE_TTL = 5 * 60 * 60  # 5 horas em segundos
GITHUB_API_URL = "https://api.github.com"


class GitHubCacheService:
    def __init__(self):
        self.db_path = DB_PATH
        self.ttl = CACHE_TTL
        self.headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _fetch_from_github(self) -> Dict[str, Any]:
        """Busca dados do GitHub API"""
        try:
            user_url = f"{GITHUB_API_URL}/users/{GITHUB_USERNAME}"
            repos_url = f"{GITHUB_API_URL}/users/{GITHUB_USERNAME}/repos?per_page=100"

            user_response = requests.get(user_url, headers=self.headers, timeout=10)
            repos_response = requests.get(repos_url, headers=self.headers, timeout=10)

            if user_response.status_code != 200 or repos_response.status_code != 200:
                print(f"Erro ao buscar dados do GitHub: {user_response.status_code}")
                return None

            user = user_response.json()
            repos = repos_response.json()

            total_stars = 0
            total_forks = 0

            for repo in repos:
                total_stars += repo.get("stargazers_count", 0)
                total_forks += repo.get("forks_count", 0)

            return {
                "repositories": user.get("public_repos", 0),
                "stars": total_stars,
                "followers": user.get("followers", 0),
                "forks": total_forks,
                "contributions": 7200,
                "downloads": "900K+",
                "avatar": user.get("avatar_url", ""),
                "bio": user.get("bio", ""),
                "profile": user.get("html_url", ""),
            }
        except Exception as e:
            print(f"Erro ao buscar dados do GitHub: {e}")
            return None

    def _is_cache_valid(self) -> bool:
        """Verifica se o cache ainda é válido"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute(
                "SELECT last_updated, ttl FROM github_stats_cache ORDER BY id DESC LIMIT 1"
            )
            row = cursor.fetchone()
            conn.close()

            if not row:
                return False

            last_updated = datetime.fromisoformat(row["last_updated"])
            ttl = row["ttl"]
            elapsed = (datetime.now() - last_updated).total_seconds()

            return elapsed < ttl
        except Exception as e:
            print(f"Erro ao verificar cache: {e}")
            return False

    def _save_to_cache(self, data: Dict[str, Any]) -> bool:
        """Salva dados no cache"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO github_stats_cache 
                (repositories, stars, followers, forks, contributions, downloads, avatar, bio, profile, last_updated, ttl)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data["repositories"],
                    data["stars"],
                    data["followers"],
                    data["forks"],
                    data["contributions"],
                    data["downloads"],
                    data["avatar"],
                    data["bio"],
                    data["profile"],
                    datetime.now().isoformat(),
                    self.ttl,
                ),
            )

            conn.commit()
            conn.close()
            print("Dados salvos no cache")
            return True
        except Exception as e:
            print(f"Erro ao salvar cache: {e}")
            return False

    def _get_cached_data(self) -> Optional[Dict[str, Any]]:
        """Busca dados do cache"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute(
                "SELECT * FROM github_stats_cache ORDER BY id DESC LIMIT 1"
            )
            row = cursor.fetchone()
            conn.close()

            if not row:
                return None

            return {
                "repositories": row["repositories"],
                "stars": row["stars"],
                "followers": row["followers"],
                "forks": row["forks"],
                "contributions": row["contributions"],
                "downloads": row["downloads"],
                "avatar": row["avatar"],
                "bio": row["bio"],
                "profile": row["profile"],
            }
        except Exception as e:
            print(f"Erro ao buscar cache: {e}")
            return None

    def get_stats(self) -> Optional[Dict[str, Any]]:
        """
        Busca estatísticas do GitHub.
        
        Retorna dados em cache se válidos, caso contrário busca da API
        e atualiza o cache.
        """
        # Verifica se cache é válido
        if self._is_cache_valid():
            print("Usando dados em cache")
            return self._get_cached_data()

        # Cache inválido ou não existe, busca da API
        print("Buscando dados da API do GitHub...")
        github_data = self._fetch_from_github()

        if github_data:
            self._save_to_cache(github_data)
            return github_data
        else:
            # Se falhar ao buscar da API, retorna cache antigo se existir
            print("Falha ao buscar da API, usando cache antigo")
            return self._get_cached_data()

    def get_cache_info(self) -> Optional[Dict[str, Any]]:
        """Retorna informações sobre o cache (tempo restante, etc)"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute(
                "SELECT last_updated, ttl FROM github_stats_cache ORDER BY id DESC LIMIT 1"
            )
            row = cursor.fetchone()
            conn.close()

            if not row:
                return {"valid": False, "message": "Nenhum cache disponível"}

            last_updated = datetime.fromisoformat(row["last_updated"])
            ttl = row["ttl"]
            elapsed = (datetime.now() - last_updated).total_seconds()
            remaining = max(0, ttl - elapsed)

            return {
                "valid": remaining > 0,
                "last_updated": last_updated.isoformat(),
                "ttl_seconds": ttl,
                "elapsed_seconds": int(elapsed),
                "remaining_seconds": int(remaining),
                "remaining_hours": remaining / 3600,
            }
        except Exception as e:
            print(f"Erro ao obter info do cache: {e}")
            return {"valid": False, "error": str(e)}
