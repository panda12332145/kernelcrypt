from fastapi import APIRouter
from app.services.wiki_video_service import WikiVideoService

router = APIRouter(prefix="/api/wiki/videos", tags=["wiki-videos"])
wiki_video_service = WikiVideoService()


@router.get("")
async def get_wiki_videos():
    """Retorna os videos da wiki cadastrados no banco de dados."""
    return wiki_video_service.get_videos()
