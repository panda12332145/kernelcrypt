from fastapi import APIRouter
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])
portfolio_service = PortfolioService()


@router.get("/about")
async def get_about():
    """Retorna dados do perfil/about (terminalCard)"""
    return portfolio_service.get_about()


@router.get("/hero")
async def get_hero():
    """Retorna dados da seção hero"""
    return portfolio_service.get_hero()


@router.get("/skills")
async def get_skills():
    """Retorna lista de skills"""
    return portfolio_service.get_skills()


@router.get("/contacts")
async def get_contacts():
    """Retorna lista de contatos"""
    return portfolio_service.get_contacts()


@router.get("/sections")
async def get_sections():
    """Retorna lista de sections"""
    return portfolio_service.get_sections()


@router.get("/all")
async def get_all():
    """Retorna todos os dados do portfólio"""
    return portfolio_service.get_all_portfolio_data()
