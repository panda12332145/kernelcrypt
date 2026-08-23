from fastapi import APIRouter

from app.services.github_cache_service import GitHubCacheService

router = APIRouter(
    prefix="/api/github",
    tags=["GitHub"]
)

cache_service = GitHubCacheService()


@router.get("/stats")
def github_stats():
    """
    Retorna estatísticas do GitHub com cache inteligente.
    
    - Se o cache é válido (< 5h), retorna dados em cache
    - Se cache é inválido (> 5h), busca da API GitHub e atualiza cache
    - Se API falhar, retorna cache antigo para manter serviço disponível
    """
    return cache_service.get_stats()


@router.get("/cache-info")
def cache_info():
    """Retorna informações sobre o cache (tempo restante, etc)"""
    return cache_service.get_cache_info()