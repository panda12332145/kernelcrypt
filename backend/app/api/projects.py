from fastapi import APIRouter
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/api/projects", tags=["projects"])

portfolio_service = PortfolioService()


@router.get("")
async def get_projects():
    """Retorna todos os projetos do banco de dados"""
    return portfolio_service.get_projects()


@router.get("/{project_id}")
async def get_project(project_id: int):
    """Retorna um projeto específico pelo ID"""
    project = portfolio_service.get_project_by_id(project_id)

    if not project:
        return {"error": "Projeto não encontrado"}

    return project
