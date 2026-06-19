from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import init_db
from routes.auth import auth_bp
from routes.expenses import expenses_bp
import os

BUILD_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")

app = Flask(__name__, static_folder=BUILD_DIR, static_url_path="")

app.config["JWT_SECRET_KEY"] = "expense-tracker-secret-change-in-production"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

CORS(app, resources={r"/api/*": {"origins": "*"}})
JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(expenses_bp, url_prefix="/api/expenses")

@app.route("/api/health")
def health():
    return {"status": "ok"}, 200

# Serve React app for all non-API routes
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path and os.path.exists(os.path.join(BUILD_DIR, path)):
        return send_from_directory(BUILD_DIR, path)
    return send_from_directory(BUILD_DIR, "index.html")

if __name__ == "__main__":
    init_db()
    print("\n✅ SpendSmart is running!")
    print("📌 Open your browser at: http://localhost:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=False)
