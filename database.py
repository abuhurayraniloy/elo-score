import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./elo.db")

# For SQLite we need check_same_thread=False
# If migrating to PostgreSQL, connect_args is not needed
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Supabase Configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client = None
if supabase_url and supabase_key and "your-project" not in supabase_url:
    try:
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
