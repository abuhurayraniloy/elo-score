# 🏆 Ranker: Premium Elo Image Ranking System

Ranker is a modern, full-stack web application designed for pairwise image ranking using the **Elo Rating System**. Inspired by premium competitive rating systems, it features a mobile-first, glassmorphic UI and a robust admin dashboard.

---

## ⚡ Quick Start: Running the Project Locally

Follow these step-by-step instructions to get the backend and frontend running on your local machine.

### 📋 Prerequisites
Ensure you have the following installed:
* **Python 3.11+** (for the FastAPI backend)
* **Node.js 18+** (for the Next.js frontend)
* **Git**

---

### 📂 Step 1: Clone & Configure Backend

1. **Clone the repository** and navigate to the project root:
   ```bash
   git clone https://github.com/abuhurayraniloy/elo-score.git
   cd elo-score
   ```

2. **Create and activate a virtual environment**:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   Create a file named `.env` in the root directory (where `main.py` is located) and copy the following configuration:
   ```ini
   DATABASE_URL=sqlite:///./elo.db
   SECRET_KEY=""
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   IMAGE_DIR=D:\images

   # Supabase Cloud Storage (For User Registrations)
   SUPABASE_URL=https://mzuslchmlyqavlftsphx.supabase.co
   SUPABASE_KEY=your_supabase_anon_public_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   ```

---

### 🗄️ Step 2: Seed the Database & Credentials

The repository includes a seeding script that sets up standard matchmaking data, system settings, and default administration accounts.

Run the seed command in your terminal:
```bash
python seed.py
```

#### 🔑 Default Accounts Created:
Use these credentials to log in and start testing immediately:

| Role | Username | Password | Email / Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `sensei` | `sherlock` | Principal Administrator Account |
| **Admin (Backup)** | `admin` | `adminpassword` | General Administrative Role |
| **User** | `testuser` | `testpassword` | Standard Voter profile |

---

### 🚀 Step 3: Run the FastAPI Backend

Start the local API development server using `uvicorn`:
```bash
uvicorn main:app --reload
```
The backend API will be live at:
* **Backend Host**: `http://localhost:8000`
* **Interactive API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🎨 Step 4: Run the Next.js Frontend

1. Open a new terminal window, navigate to the `/frontend` directory:
   ```bash
   cd frontend
   ```

2. **Install Node modules**:
   ```bash
   npm install
   ```

3. **Run the Next.js development server**:
   ```bash
   npm run dev
   ```
The frontend interface will be live at:
* **Local Web Address**: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Production Deployment Guide

Deploying this project to cloud hosting is fully automated and optimized.

### 1. Backend (FastAPI on Railway)
1. Link your repository to a new project on [Railway.app](https://railway.app).
2. Insert your `.env` keys into Railway's **Environment Variables** panel.
3. In Railway settings, click **Generate Domain** under Environment to get your backend URL.
*Railway automatically detects the `Procfile` pushed to the repository root and handles multi-threaded startup seamlessly!*

### 2. Frontend (Next.js on Vercel)
1. Import your repository into [Vercel.com](https://vercel.com).
2. Set the **Root Directory** setting to `frontend`.
3. Add a single environment variable:
   * **Name**: `NEXT_PUBLIC_API_URL`
   * **Value**: *[Your Railway Backend Domain URL]*
4. Click **Deploy**.

---

Developed with ❤️ by **Antigravity AI**.
