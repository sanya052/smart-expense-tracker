# 💸 SpendSmart — AI Expense Tracker

Full-stack expense tracker with ML-powered spending insights.
Flask backend + React frontend (pre-built, no Node.js needed to run).

---

## ✅ Requirements
- Python 3.8 or higher (check: `python3 --version`)
- pip (check: `pip3 --version`)
- A browser

**You do NOT need Node.js to run this app.**

---

## 🚀 How to Run (3 steps)

### Step 1 — Download & extract the project
Unzip the folder somewhere on your computer.

### Step 2 — Open a terminal inside the project folder
```bash
cd expense-tracker
```

### Step 3 — Run the start script

**On macOS/Linux:**
```bash
bash start.sh
```

**On Windows (use Git Bash or WSL):**
```bash
bash start.sh
```

Or manually:
```bash
cd backend
python3 -m venv venv
venv/bin/pip install flask flask-cors flask-jwt-extended numpy werkzeug
venv/bin/python app.py
```

Then open **http://localhost:5000** in your browser. Done!

---

## 📁 Project Structure

```
expense-tracker/
├── start.sh                  ← Run this to start everything
├── backend/
│   ├── app.py                ← Flask server (serves API + React UI)
│   ├── models.py             ← SQLite schema
│   ├── routes/
│   │   ├── auth.py           ← POST /api/auth/register, /api/auth/login
│   │   └── expenses.py       ← CRUD + summary + CSV export
│   ├── ml/
│   │   └── cluster.py        ← KMeans from scratch (pure NumPy)
│   └── requirements.txt
├── frontend/
│   ├── build/                ← Pre-built React app (served by Flask)
│   └── src/                  ← Source (edit if you want to modify UI)
│       ├── App.js
│       ├── api.js
│       ├── pages/
│       │   ├── AuthPage.jsx
│       │   └── Dashboard.jsx
│       └── components/
│           └── ExpenseForm.jsx
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | What it does |
|--------|----------|------|--------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login → returns JWT token |
| GET | /api/expenses/ | JWT | List all your expenses |
| POST | /api/expenses/ | JWT | Add an expense |
| PUT | /api/expenses/:id | JWT | Edit an expense |
| DELETE | /api/expenses/:id | JWT | Delete an expense |
| GET | /api/expenses/summary | JWT | Charts data + cluster summary |
| GET | /api/expenses/export | JWT | Download expenses as CSV |

---

## ✨ Features

- **Register / Login** with JWT authentication
- **Add, edit, delete** expenses (category, amount, date, note)
- **KMeans clustering** labels each expense: Low Spend / Mid Spend / High Spend
- **AI Insight panel**: top spending category + personalised saving tip
- **Donut chart** (spend by category) + **Bar chart** (monthly trend, last 6 months)
- **Export CSV** — download all your data anytime

---

## 🌐 Deploy Online

### Backend → Render.com (free)
1. Push project to GitHub
2. New Web Service → connect repo
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `python app.py`
6. Add env var: `JWT_SECRET_KEY = your-secure-random-string`

### Frontend → Netlify (free)
1. In `frontend/src/api.js`, change `baseURL` to your Render URL
2. Run `npm run build` inside `frontend/`
3. Drag the `build/` folder onto Netlify

---

## 🛠 Troubleshooting

| Problem | Fix |
|---------|-----|
| `python3: command not found` | Install Python 3 from python.org |
| Port 5000 already in use | Change port in `app.py`: `app.run(port=5001)` |
| `ModuleNotFoundError` | Run `venv/bin/pip install -r requirements.txt` again |
| Charts not loading | Make sure you added at least 1 expense first |
| Cluster labels show `—` | Add at least 3 expenses — clustering needs minimum 3 |
