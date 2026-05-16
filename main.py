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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static files for images
IMAGE_DIR = os.getenv("IMAGE_DIR", "D:\\images")
if os.path.exists(IMAGE_DIR):
    app.mount("/static", StaticFiles(directory=IMAGE_DIR), name="static")
else:
    print(f"Warning: Image directory {IMAGE_DIR} does not exist.")

app.include_router(auth_router.router)
app.include_router(api.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Elo Image Ranking API. Check /docs for documentation."}
