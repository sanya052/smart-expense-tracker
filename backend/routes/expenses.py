from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db
from ml.cluster import run_clustering
import csv, io

expenses_bp = Blueprint("expenses", __name__)

@expenses_bp.route("/", methods=["GET"])
@jwt_required()
def get_expenses():
    user_id = get_jwt_identity()
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows]), 200

@expenses_bp.route("/", methods=["POST"])
@jwt_required()
def add_expense():
    user_id = get_jwt_identity()
    data = request.get_json()

    category = data.get("category", "").strip()
    amount = data.get("amount")
    date = data.get("date", "").strip()
    note = data.get("note", "").strip()

    if not category or not amount or not date:
        return jsonify({"error": "category, amount, and date are required"}), 400

    try:
        amount = float(amount)
    except ValueError:
        return jsonify({"error": "amount must be a number"}), 400

    conn = get_db()
    conn.execute(
        "INSERT INTO expenses (user_id, category, amount, date, note) VALUES (?, ?, ?, ?, ?)",
        (user_id, category, amount, date, note)
    )
    conn.commit()

    # re-run clustering after each new entry
    run_clustering(user_id, conn)
    conn.close()

    return jsonify({"message": "Expense added"}), 201

@expenses_bp.route("/<int:expense_id>", methods=["PUT"])
@jwt_required()
def edit_expense(expense_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM expenses WHERE id = ? AND user_id = ?",
        (expense_id, user_id)
    ).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Expense not found"}), 404

    category = data.get("category", existing["category"])
    amount = data.get("amount", existing["amount"])
    date = data.get("date", existing["date"])
    note = data.get("note", existing["note"])

    conn.execute(
        "UPDATE expenses SET category=?, amount=?, date=?, note=? WHERE id=?",
        (category, float(amount), date, note, expense_id)
    )
    conn.commit()
    run_clustering(user_id, conn)
    conn.close()
    return jsonify({"message": "Expense updated"}), 200

@expenses_bp.route("/<int:expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    user_id = get_jwt_identity()
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM expenses WHERE id = ? AND user_id = ?",
        (expense_id, user_id)
    ).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Expense not found"}), 404

    conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Expense deleted"}), 200

@expenses_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_summary():
    user_id = get_jwt_identity()
    conn = get_db()
    rows = conn.execute(
        "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category",
        (user_id,)
    ).fetchall()
    monthly = conn.execute(
        """
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
        FROM expenses WHERE user_id = ?
        GROUP BY month ORDER BY month DESC LIMIT 6
        """,
        (user_id,)
    ).fetchall()
    clusters = conn.execute(
        "SELECT cluster_label, COUNT(*) as count, SUM(amount) as total FROM expenses WHERE user_id=? AND cluster_label IS NOT NULL GROUP BY cluster_label",
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify({
        "by_category": [dict(r) for r in rows],
        "by_month": [dict(r) for r in monthly],
        "clusters": [dict(r) for r in clusters]
    }), 200

@expenses_bp.route("/export", methods=["GET"])
@jwt_required()
def export_csv():
    user_id = get_jwt_identity()
    conn = get_db()
    rows = conn.execute(
        "SELECT category, amount, date, note FROM expenses WHERE user_id = ? ORDER BY date DESC",
        (user_id,)
    ).fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Category", "Amount", "Date", "Note"])
    for r in rows:
        writer.writerow([r["category"], r["amount"], r["date"], r["note"]])

    from flask import Response
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=expenses.csv"}
    )
