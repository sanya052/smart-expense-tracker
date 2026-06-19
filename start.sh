#!/bin/bash
echo "=================================="
echo "  💸 SpendSmart - Starting up..."
echo "=================================="

# Go to backend
cd "$(dirname "$0")/backend"

# Setup venv if missing
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Install deps if needed
echo "📦 Installing Python dependencies..."
venv/bin/pip install flask flask-cors flask-jwt-extended numpy werkzeug -q

# Init DB
venv/bin/python -c "from models import init_db; init_db()" 2>/dev/null

echo ""
echo "✅ Open browser at: http://localhost:5000"
echo "   Press Ctrl+C to stop."
echo ""

# Run Flask (serves both API + React build)
venv/bin/python app.py
