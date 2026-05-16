# 🏆 Ranker: Premium Elo Image Ranking System

Ranker is a modern, full-stack web application designed for pairwise image ranking using the **Elo Rating System**. Inspired by high-end dating apps and competitive ranking platforms, it features a mobile-first, glassmorphic UI and a robust admin management console.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000)
![Database](https://img.shields.io/badge/Database-SQLite-003B57)

---

## ✨ Key Features

### 🗳️ Voting Interface
- **Tinder-Style Pairwise Comparison**: Compare two images and vote for your favorite.
- **Progress Tracking**: Real-time progress bar showing your daily voting activity.
- **Daily Limits**: Customizable voting limits per user to prevent spam and ensure data quality.
- **Smooth Animations**: High-performance transitions and hover effects.

### 👑 Admin Console
- **Comprehensive Dashboard**: Live stats on total votes, active users, and top-performing photos.
- **Photo Management**: Upload new images directly to the cloud (Supabase), delete images, or manually override Elo ratings.
- **User Moderation**: 
  - **Approval System**: New users must be manually approved by an admin before they can vote.
  - **Role Management**: Easily promote users to Admin or demote them.
- **System Settings**: Live-update system-wide settings like the daily vote limit.

### 🔒 Security & Performance
- **JWT Authentication**: Secure login and session management.
- **Role-Based Access Control (RBAC)**: Strict separation between user and admin capabilities.
- **Optimized Elo Algorithm**: Real-time rating updates using standard Elo K-factor logic.
- **Cloud Storage**: Seamless integration with Supabase for reliable image hosting.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, Vanilla CSS (Custom Design System) |
| **Backend** | FastAPI (Python 3.13) |
| **ORM** | SQLAlchemy |
| **Database** | SQLite (Production-ready Postgres compatible) |
| **Storage** | Supabase Storage |
| **Auth** | JWT (JSON Web Tokens) with Bcrypt hashing |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase Account (for image storage)

### 1. Backend Setup
```bash
# Clone the repository
cd ranker

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase keys and SMTP settings
```

### 2. Database Initialization
```bash
# Seed the database and create the 'sensei' admin account
python seed.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Interactive API Docs**: `http://localhost:8000/docs`

---

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following:

```ini
# Database
DATABASE_URL=sqlite:///./elo.db

# Security
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 🤝 Contributing

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

Developed with ❤️ by **Antigravity AI**.
