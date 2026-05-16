# Elo Ranking API Walkthrough

I have successfully built the complete FastAPI backend for your pairwise image ranking system! Below is a summary of the implemented features, architecture, and instructions on how to use it.

## Features Implemented

- **Authentication & Authorization**: Integrated JWT-based authentication with bcrypt password hashing. Roles (`admin` and `user`) are supported.
- **Dynamic Image Loading**: The application reads your images directly from `D:\images` using FastAPI's `StaticFiles`. The database stores the filename and builds a URL dynamically.
- **Elo Matchmaking Algorithm**: The `/api/next-match` endpoint selects an image with the fewest matches and pairs it with an opponent of a similar Elo rating that the user hasn't seen yet.
- **Dynamic K-Factor Rating System**: The `/api/submit-vote` endpoint calculates new ratings in an atomic transaction. Images with fewer than 5 matches get a $K$-factor of 64, while established ones get 16.
- **Leaderboard**: The `/api/leaderboard` endpoint returns images sorted by highest Elo rating.

## File Architecture

Here is the modular structure I created:
```text
D:\Code\elo\
├── .env                # Environment configuration (DB URL, Auth secret, Image Dir)
├── requirements.txt    # Python dependencies
├── database.py         # SQLAlchemy engine and session setup
├── models.py           # Database models (User, Photo, Match)
├── schemas.py          # Pydantic schemas for data validation
├── auth.py             # JWT token generation and password hashing
├── crud.py             # Core logic for database transactions and Elo calculations
├── routers/
│   ├── auth_router.py  # Endpoints: /api/auth/register, /api/auth/login
│   └── api.py          # Endpoints: /api/next-match, /api/submit-vote, /api/leaderboard
├── main.py             # FastAPI entrypoint, static files routing
└── seed.py             # Script to initialize DB with test accounts and actual images
```

## How to Run & Verify Locally

> [!IMPORTANT]
> Make sure you are in the `d:\Code\elo` directory.

### 1. Install Dependencies
Run the following command to install FastAPI, SQLAlchemy, Uvicorn, and Auth libraries:
```bash
pip install -r requirements.txt
```

### 2. Seed the Database
Make sure you have images inside your `D:\images` folder. Run the seed script:
```bash
python seed.py
```
*This will create the SQLite database (`elo.db`), generate a `testuser` (password: `testpassword`) and an `admin` (password: `adminpassword`), and load all the images into the database.*

### 3. Start the Server
```bash
uvicorn main:app --reload
```

### 4. Interactive Testing
Open your browser and navigate to the built-in Swagger UI:
**[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

From there, you can:
1. Hit **POST /api/auth/login** to log in using `testuser` and `testpassword`. This will give you an access token.
2. Click the green "Authorize" pad-lock button at the top right of the screen and paste your token.
3. Test **GET /api/next-match** and **POST /api/submit-vote** as an authenticated user.
4. Test **GET /api/leaderboard** to see the standings!

## Deployment Note
Since we use `.env` to define the database URL (`DATABASE_URL=sqlite:///./elo.db`), migrating to PostgreSQL for deployment will be as easy as changing that single environment variable and ensuring `psycopg2` is installed on your production server.
