import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from "chart.js";
import API from "../api";
import ExpenseForm from "../components/ExpenseForm";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const COLORS = ["#667eea", "#f6ad55", "#68d391", "#fc8181", "#76e4f7", "#b794f4", "#f687b3", "#9ae6b4"];

const clusterColor = { "Low Spend": "#68d391", "Mid Spend": "#f6ad55", "High Spend": "#fc8181" };

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchAll = useCallback(async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        API.get("/expenses/"),
        API.get("/expenses/summary"),
      ]);
      setExpenses(expRes.data);
      setSummary(sumRes.data);
    } catch {
      localStorage.clear();
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await API.delete(`/expenses/${id}`);
    fetchAll();
  };

  const exportCSV = async () => {
    const res = await API.get("/expenses/export", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
  };

  const logout = () => { localStorage.clear(); navigate("/"); };

  const topCategory = summary?.by_category?.length
    ? summary.by_category.reduce((a, b) => (a.total > b.total ? a : b))
    : null;

  const totalSpend = summary?.by_category?.reduce((s, r) => s + r.total, 0) || 0;

  if (loading) return <div style={styles.loading}>Loading your data...</div>;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💸 SpendSmart</h1>
          <p style={styles.welcome}>Welcome, {user.username}!</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={exportCSV} style={styles.outlineBtn}>⬇ Export CSV</button>
          <button onClick={logout} style={styles.outlineBtn}>Log Out</button>
        </div>
      </div>

      {/* AI Insight Panel */}
      {topCategory && (
        <div style={styles.insightBox}>
          <span style={styles.insightBadge}>✨ AI Insight</span>
          <p style={styles.insightText}>
            Your top spending category is <strong>{topCategory.category}</strong> at{" "}
            <strong>₹{topCategory.total.toFixed(2)}</strong> —{" "}
            {((topCategory.total / totalSpend) * 100).toFixed(0)}% of your total spend.
            {topCategory.category === "Food" && " Try meal prepping on weekends to cut costs!"}
            {topCategory.category === "Shopping" && " Consider a 24-hour rule before buying non-essentials."}
            {topCategory.category === "Entertainment" && " Review your subscriptions for unused services."}
          </p>
        </div>
      )}

      {/* Add Expense */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Add Expense</h2>
        <ExpenseForm onAdded={fetchAll} />
      </div>

      {/* Charts */}
      {summary && summary.by_category.length > 0 && (
        <div style={styles.chartRow}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Spend by Category</h2>
            <div style={{ maxWidth: 280, margin: "0 auto" }}>
              <Doughnut
                data={{
                  labels: summary.by_category.map((r) => r.category),
                  datasets: [{
                    data: summary.by_category.map((r) => r.total),
                    backgroundColor: COLORS,
                    borderWidth: 2,
                  }],
                }}
                options={{ plugins: { legend: { position: "bottom" } } }}
              />
            </div>
          </div>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Monthly Spend</h2>
            <Bar
              data={{
                labels: summary.by_month.map((r) => r.month).reverse(),
                datasets: [{
                  label: "Total (₹)",
                  data: summary.by_month.map((r) => r.total).reverse(),
                  backgroundColor: "#667eea",
                  borderRadius: 6,
                }],
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      )}

      {/* Cluster summary */}
      {summary?.clusters?.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Spending Patterns (ML Clusters)</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {summary.clusters.map((c) => (
              <div key={c.cluster_label} style={{
                ...styles.clusterChip,
                background: clusterColor[c.cluster_label] + "22",
                borderColor: clusterColor[c.cluster_label],
              }}>
                <span style={{ color: clusterColor[c.cluster_label], fontWeight: 700 }}>
                  {c.cluster_label}
                </span>
                <span style={styles.clusterSub}>{c.count} entries · ₹{c.total.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>All Expenses</h2>
        {expenses.length === 0 ? (
          <p style={{ color: "#718096" }}>No expenses yet. Add one above!</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Date", "Category", "Amount", "Note", "Cluster", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) =>
                  editItem?.id === e.id ? (
                    <tr key={e.id}>
                      <td colSpan={6} style={{ padding: "12px 8px" }}>
                        <ExpenseForm
                          editData={editItem}
                          onUpdated={() => { setEditItem(null); fetchAll(); }}
                          onCancel={() => setEditItem(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={e.id} style={styles.tr}>
                      <td style={styles.td}>{e.date}</td>
                      <td style={styles.td}><span style={styles.catBadge}>{e.category}</span></td>
                      <td style={styles.td}>₹{parseFloat(e.amount).toFixed(2)}</td>
                      <td style={styles.td}>{e.note || "—"}</td>
                      <td style={styles.td}>
                        {e.cluster_label ? (
                          <span style={{
                            ...styles.clusterBadge,
                            background: (clusterColor[e.cluster_label] || "#ccc") + "22",
                            color: clusterColor[e.cluster_label] || "#666",
                          }}>
                            {e.cluster_label}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => setEditItem(e)} style={styles.iconBtn}>✏️</button>
                        <button onClick={() => deleteExpense(e.id)} style={styles.iconBtn}>🗑️</button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 18, color: "#718096" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: "#2d3748" },
  welcome: { margin: "4px 0 0", color: "#718096", fontSize: 14 },
  outlineBtn: {
    padding: "8px 16px", border: "1px solid #e2e8f0", borderRadius: 8,
    background: "#fff", cursor: "pointer", fontSize: 13, color: "#4a5568",
  },
  insightBox: {
    background: "linear-gradient(135deg, #667eea15, #764ba215)",
    border: "1px solid #667eea44",
    borderRadius: 12, padding: "16px 20px", marginBottom: 20,
  },
  insightBadge: { fontSize: 12, fontWeight: 700, color: "#667eea", textTransform: "uppercase", letterSpacing: 0.5 },
  insightText: { margin: "6px 0 0", color: "#4a5568", fontSize: 14, lineHeight: 1.6 },
  card: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: "20px 24px", marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  sectionTitle: { margin: "0 0 16px", fontSize: 17, fontWeight: 600, color: "#2d3748" },
  chartRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 0 },
  clusterChip: {
    display: "flex", flexDirection: "column", padding: "12px 18px",
    borderRadius: 10, border: "1px solid", minWidth: 140,
  },
  clusterSub: { fontSize: 12, color: "#718096", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "2px solid #e2e8f0", color: "#718096", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #f7fafc" },
  td: { padding: "12px 12px", color: "#4a5568", verticalAlign: "middle" },
  catBadge: { background: "#667eea15", color: "#667eea", padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 500 },
  clusterBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 500 },
  iconBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, marginRight: 4, padding: "4px" },
};
