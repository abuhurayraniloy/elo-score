import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import auth_router, api
from dotenv import load_dotenv

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Elo Image Ranking API", version="1.0.0")

# Setup CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL] if FRONTEND_URL != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static files for images (Create data/images directory if it doesn't exist)
IMAGE_DIR = os.getenv("IMAGE_DIR", os.path.join(os.getcwd(), "data", "images"))
os.makedirs(IMAGE_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=IMAGE_DIR), name="static")

app.include_router(auth_router.router)
app.include_router(api.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to the Elo Image Ranking API. Check /docs for documentation."
    }
