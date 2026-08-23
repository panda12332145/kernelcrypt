import sqlite3
import json
import os
from typing import Dict, List, Any, Optional

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "..",
    "databases",
    "portfolio.db"
)

# =========================================================
# DEFAULT COLORS
# =========================================================

DEFAULT_COLORS = {
    "tags": "#fbbf24",
    "linguagem": "#04DC77",
    "framework": "#d6ff00",
    "red_team": "#ff0000",
    "blue_team": "#00f1ff",
    "tipo": "#999999",
    "customizado": "#9333ea",
}


# =========================================================
# HELPERS
# =========================================================

def decode_json(value):
    """Decodifica valor JSON do banco"""
    if not value:
        return []
    try:
        return json.loads(value)
    except:
        return []


class PortfolioService:
    def __init__(self):
        self.db_path = DB_PATH

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    # =========================================================
    # PROJECTS
    # =========================================================

    def get_projects(self) -> List[Dict[str, Any]]:
        """Busca todos os projetos do banco de dados"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM projects ORDER BY featured DESC, id ASC")
            rows = cursor.fetchall()
            conn.close()

            projects = []

            for row in rows:
                project = dict(row)

                project["linguagens"] = decode_json(project["linguagens"])
                project["tags"] = decode_json(project["tags"])
                project["frameworks"] = decode_json(project["frameworks"])
                project["customizado"] = decode_json(project["customizado"])
                project["featured"] = bool(project.get("featured", 0))
                project["colors"] = DEFAULT_COLORS

                projects.append(project)

            return projects

        except Exception as e:
            print(f"Erro ao buscar projects: {e}")
            return []

    def get_project_by_id(self, project_id: int) -> Optional[Dict[str, Any]]:
        """Busca um projeto específico pelo ID"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM projects WHERE id=?", (project_id,))
            row = cursor.fetchone()
            conn.close()

            if not row:
                return None

            project = dict(row)
            project["linguagens"] = decode_json(project["linguagens"])
            project["tags"] = decode_json(project["tags"])
            project["frameworks"] = decode_json(project["frameworks"])
            project["customizado"] = decode_json(project["customizado"])
            project["featured"] = bool(project.get("featured", 0))
            project["colors"] = DEFAULT_COLORS

            return project

        except Exception as e:
            print(f"Erro ao buscar project {project_id}: {e}")
            return None

    # =========================================================
    # ABOUT
    # =========================================================

    def get_about(self) -> Dict[str, Any]:
        """Busca dados do about/perfil do banco de dados"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM about LIMIT 1")
            row = cursor.fetchone()
            conn.close()

            if not row:
                return {}

            return {
                "name": row["name"],
                "alias": row["alias"],
                "role": row["role"],
                "education": json.loads(row["education"]) if row["education"] else {},
                "stack": json.loads(row["stack"]) if row["stack"] else {},
                "focus": json.loads(row["focus"]) if row["focus"] else [],
                "languages": json.loads(row["languages"]) if row["languages"] else [],
                "specialties": json.loads(row["specialties"]) if row["specialties"] else [],
                "scale": row["scale"],
                "fun_fact": row["fun_fact"],
            }
        except Exception as e:
            print(f"Erro ao buscar about: {e}")
            return {}

    # =========================================================
    # HERO
    # =========================================================

    def get_hero(self) -> Dict[str, Any]:
        """Busca dados da seção hero do banco de dados"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM hero LIMIT 1")
            row = cursor.fetchone()
            conn.close()
            
            if row:
                tags = json.loads(row['tags']) if row['tags'] else []
                return {
                    "status": row['status'],
                    "status_color": row['status_color'],
                    "title": row['title'],
                    "highlight": row['highlight'],
                    "subtitle": row['subtitle'],
                    "tags": tags
                }
            return {}
        except Exception as e:
            print(f"Erro ao buscar hero: {e}")
            return {}

    # =========================================================
    # SKILLS
    # =========================================================

    def get_skills(self) -> List[Dict[str, str]]:
        """Busca lista de skills do banco de dados"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, title, icon, iconType, color FROM skills")
            rows = cursor.fetchall()
            conn.close()
            
            skills = []
            for row in rows:
                skills.append({
                    "id": row[0],
                    "name": row[1],
                    "icon": row[2],
                    "iconType": row[3] if row[3] else 'url',
                    "category": "General"
                })
            return skills
        except Exception as e:
            print(f"Erro ao buscar skills: {e}")
            return []

    # =========================================================
    # CONTACTS
    # =========================================================

    def get_contacts(self) -> List[Dict[str, str]]:
        """Busca lista de contatos do banco de dados"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM contacts")
            rows = cursor.fetchall()
            conn.close()
            
            contacts = []
            for row in rows:
                contacts.append({
                    "platform": row['title'],
                    "value": row['title'],
                    "url": row['link'],
                    "icon": row['icon'],
                })
            return contacts
        except Exception as e:
            print(f"Erro ao buscar contacts: {e}")
            return []

    # =========================================================
    # SECTIONS
    # =========================================================

    def get_sections(self) -> List[Dict[str, str]]:
        """Busca lista de sections do banco de dados"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM sections")
            rows = cursor.fetchall()
            conn.close()
            
            sections = []
            for row in rows:
                sections.append({
                    "id": row['id'],
                    "section_key": row['section_key'],
                    "title": row['title'],
                    "description": row['description']
                })
            return sections
        except Exception as e:
            print(f"Erro ao buscar sections: {e}")
            return []

    # =========================================================
    # ALL DATA
    # =========================================================

    def get_all_portfolio_data(self) -> Dict[str, Any]:
        """Busca todos os dados do portfólio em uma única chamada"""
        return {
            "about": self.get_about(),
            "hero": self.get_hero(),
            "skills": self.get_skills(),
            "contacts": self.get_contacts(),
            "sections": self.get_sections(),
            "projects": self.get_projects(),
        }
