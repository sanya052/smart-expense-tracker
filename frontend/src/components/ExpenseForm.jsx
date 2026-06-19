import { useState } from "react";
import API from "../api";

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "Education", "Other"];

export default function ExpenseForm({ onAdded, editData, onUpdated, onCancel }) {
  const [form, setForm] = useState(
    editData || { category: "Food", amount: "", date: new Date().toISOString().split("T")[0], note: "" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (editData) {
        await API.put(`/expenses/${editData.id}`, form);
        onUpdated && onUpdated();
      } else {
        await API.post("/expenses/", form);
        setForm({ category: "Food", amount: "", date: new Date().toISOString().split("T")[0], note: "" });
        onAdded && onAdded();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={styles.form}>
      <div style={styles.row}>
        <select name="category" value={form.category} onChange={handle} style={styles.input}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount (₹)"
          value={form.amount}
          onChange={handle}
          style={{ ...styles.input, width: 130 }}
          required
        />
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handle}
          style={{ ...styles.input, width: 150 }}
          required
        />
      </div>
      <div style={styles.row}>
        <input
          name="note"
          placeholder="Note (optional)"
          value={form.note}
          onChange={handle}
          style={{ ...styles.input, flex: 1 }}
        />
        <button type="submit" style={styles.btn} disabled={loading}>
          {loading ? "Saving..." : editData ? "Update" : "Add Expense"}
        </button>
        {editData && (
          <button type="button" onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
        )}
      </div>
      {error && <p style={{ color: "#e53e3e", fontSize: 13, margin: 0 }}>{error}</p>}
    </form>
  );
}

const styles = {
  form: { display: "flex", flexDirection: "column", gap: 10 },
  row: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: {
    padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 14, outline: "none", background: "#fff",
  },
  btn: {
    padding: "10px 20px", background: "#667eea", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  cancelBtn: {
    padding: "10px 16px", background: "#fff", color: "#718096",
    border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, cursor: "pointer",
  },
};
