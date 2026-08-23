from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query, Security, Depends
from fastapi.responses import FileResponse
from fastapi.security import APIKeyHeader

from app.services.wiki_book_service import WikiBookService

router = APIRouter(prefix="/api/wiki/books", tags=["wiki-books"])
wiki_book_service = WikiBookService()

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

from app.core.config import ADMIN_API_KEY

def verify_api_key(api_key: str = Security(api_key_header)):
    if not ADMIN_API_KEY or api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Acesso não autorizado")
    return api_key


def media_type_for(file_format: str) -> str:
    return {
        "pdf": "application/pdf",
        "epub": "application/epub+zip",
        "md": "text/markdown",
        "markdown": "text/markdown",
        "html": "text/html",
        "htm": "text/html",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }.get(file_format.lower(), "application/octet-stream")


@router.get("")
async def get_wiki_books():
    """Retorna os livros cadastrados no banco de dados."""
    return wiki_book_service.get_books()


@router.get("/{book_id}")
async def get_wiki_book(book_id: int):
    book = wiki_book_service.get_book(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livro nao encontrado")
    return book


@router.get("/{book_id}/content")
async def get_wiki_book_content(book_id: int):
    content = wiki_book_service.get_book_content(book_id)
    if not content:
        raise HTTPException(status_code=404, detail="Livro nao encontrado")
    return content


@router.api_route("/{book_id}/file", methods=["GET", "HEAD"])
async def get_wiki_book_file(book_id: int):
    book = wiki_book_service.get_book(book_id)
    path = wiki_book_service.get_book_file_path(book_id)
    if not book or not path:
        raise HTTPException(status_code=404, detail="Arquivo do livro nao encontrado")
    return FileResponse(path, media_type=media_type_for(book["fileFormat"]), content_disposition_type="inline")


@router.api_route("/{book_id}/download", methods=["GET", "HEAD"])
async def download_wiki_book(book_id: int):
    book = wiki_book_service.get_book(book_id)
    path = wiki_book_service.get_book_file_path(book_id)
    if not book or not path:
        raise HTTPException(status_code=404, detail="Arquivo do livro nao encontrado")
    return FileResponse(
        path,
        filename=book["fileName"],
        media_type=media_type_for(book["fileFormat"]),
        content_disposition_type="attachment",
    )


@router.get("/{book_id}/annotations")
async def get_wiki_book_annotations(
    book_id: int,
    user_id: str = Query(default=""),
    scope: str = Query(default="mine"),
):
    return wiki_book_service.get_annotations(book_id, user_id=user_id, scope=scope)


@router.post("/{book_id}/annotations")
async def add_wiki_book_annotation(book_id: int, payload: Dict[str, Any], api_key: str = Depends(verify_api_key)):
    if not wiki_book_service.get_book(book_id):
        raise HTTPException(status_code=404, detail="Livro nao encontrado")
    return wiki_book_service.add_annotation(book_id, payload)


@router.delete("/annotations/{annotation_id}")
async def delete_wiki_book_annotation(annotation_id: int, user_id: str = Query(default=""), api_key: str = Depends(verify_api_key)):
    deleted = wiki_book_service.delete_annotation(annotation_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Marcacao nao encontrada para este leitor")
    return {"deleted": True}
