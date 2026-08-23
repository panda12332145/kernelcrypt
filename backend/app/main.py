from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.github import router as github_router
from app.api.portfolio import router as portfolio_router
from app.api.projects import router as projects_router
from app.api.wiki_books import router as wiki_books_router
from app.api.wiki_videos import router as wiki_videos_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="Athos API",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(github_router)
app.include_router(portfolio_router)
app.include_router(projects_router)
app.include_router(wiki_books_router)
app.include_router(wiki_videos_router)


@app.get("/")
def root():
    return {
        "status": "online",
        "message": "Athos Backend Running"
    }
