from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.portfolio import router as portfolio_router
from app.api.projects import router as projects_router
from app.api.github import router as github_router
from app.api.wiki_books import router as wiki_books_router
from app.api.wiki_videos import router as wiki_videos_router
from app.api.cyber_profiles import router as cyber_profiles_router
from datetime import datetime
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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

app.include_router(portfolio_router)
app.include_router(projects_router)
app.include_router(github_router)
app.include_router(wiki_books_router)
app.include_router(wiki_videos_router)
app.include_router(cyber_profiles_router)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Backend API",
        "author": "Athos Dã Boanerges Mendes Rocha",
        "timestamp": str(datetime.now())
    }


@app.get("/api/info")
def api_info():
    return {
        "name": "Athos Dã Boanerges Mendes Rocha",
        "role": "Cybersecurity Researcher",
        "stack": [
            "Python",
            "C++",
            "Assembly x86-64",

            "FastAPI",
            "Linux"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    
    HOST = "0.0.0.0"
    PORT = 8000
    
    print("=" * 50)
    print("BACKEND ONLINE")
    print(f"Listening on http://127.0.0.1:{PORT} (bound to {HOST})")
    print("=" * 50)
    
    uvicorn.run(app, host=HOST, port=PORT)
