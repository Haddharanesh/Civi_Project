# Civic Project

Civic complaint management portal with React frontend and **Python FastAPI** backend.

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+

No Java or MySQL required (SQLite is used by default).

## Quick start

### 1. Backend (Python)

```powershell
cd backend\civic_api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

API runs at **http://localhost:8080**

Default accounts (created on first run):

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@civic.gov | admin123 |
| Dept Admin | deptadmin@civic.gov | admin123 |

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

## Project structure

```
CivicProject/
├── backend/
│   └── civic_api/          # Python FastAPI backend (use this)
│       ├── app/
│       ├── requirements.txt
│       └── run.py
├── backend/civicbackend/   # Legacy Java backend (optional)
└── frontend/               # React + Vite app
```

## Optional: MySQL

Create `.env` in `backend/civic_api/`:

```
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/civic_db
```

Install driver: `pip install pymysql`
