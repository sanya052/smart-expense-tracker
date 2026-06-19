import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await API.post("/auth/register", form);
        setMode("login");
        setForm({ ...form, username: "" });
        setError("Registered! Please log in.");
      } else {
        const res = await API.post("/auth/login", {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>💸 SpendSmart</h1>
        <p style={styles.sub}>AI-powered expense insights</p>

        <div style={styles.tabs}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
            >
              {m === "login" ? "Log In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={styles.form}>
          {mode === "register" && (
            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handle}
              style={styles.input}
              required
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handle}
            style={styles.input}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handle}
            style={styles.input}
            required
          />
          {error && (
            <p style={{ color: error.startsWith("Registered") ? "green" : "#e53e3e", fontSize: 13, margin: "4px 0" }}>
              {error}
            </p>
          )}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "2.5rem 2rem",
    width: 360,
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    textAlign: "center",
  },
  logo: { margin: 0, fontSize: 28, fontWeight: 700, color: "#2d3748" },
  sub: { color: "#718096", fontSize: 14, marginTop: 4, marginBottom: 24 },
  tabs: { display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", marginBottom: 20 },
  tab: {
    flex: 1, padding: "10px 0", border: "none", background: "#f7fafc",
    cursor: "pointer", fontSize: 14, color: "#718096", transition: "all 0.2s",
  },
  tabActive: { background: "#667eea", color: "#fff", fontWeight: 600 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: {
    padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 14, outline: "none", transition: "border 0.2s",
  },
  btn: {
    padding: "13px", background: "#667eea", color: "#fff", border: "none",
    borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4,
  },
};
