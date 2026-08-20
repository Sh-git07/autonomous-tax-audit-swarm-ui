import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Spinner } from "../components/shared";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1b2318",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Subtle grid background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `linear-gradient(#3a4c3412 1px, transparent 1px), linear-gradient(90deg, #3a4c3412 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: 380,
          background: "#222d1d",
          border: "1px solid #3a4c34",
          borderRadius: 10,
          padding: 32,
          position: "relative",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "linear-gradient(135deg, #4ade80, #22d3ee)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 24,
              fontWeight: 800,
              color: "#0d1f0a",
              boxShadow: "0 0 20px rgba(74, 222, 128, 0.35)",
            }}
          >
            ⚡
          </div>
          <div style={{ color: "#d8e8ce", fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 6 }}>
            Autonomous Tax Audit Swarm
          </div>
          <div style={{ color: "#7a9a70", fontSize: 12, lineHeight: 1.5 }}>
            Multi-Agent Swarm Intelligence for Real-Time Tax Auditing &amp; GSTR Reconciliation
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                color: "#7a9a70",
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="auditor.lead@swarm.tax"
              required
              style={{
                width: "100%",
                background: "#1b2318",
                border: "1px solid #3a4c34",
                borderRadius: 6,
                color: "#d8e8ce",
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "var(--font-sans)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#4ade80"; }}
              onBlur={(e) => { e.target.style.borderColor = "#3a4c34"; }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "#7a9a70",
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                background: "#1b2318",
                border: "1px solid #3a4c34",
                borderRadius: 6,
                color: "#d8e8ce",
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "var(--font-sans)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#4ade80"; }}
              onBlur={(e) => { e.target.style.borderColor = "#3a4c34"; }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "#3d1a1a",
                border: "1px solid #ef4444",
                borderRadius: 5,
                padding: "8px 12px",
                color: "#f8a0a0",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button-interactive"
            style={{
              background: loading ? "#293724" : "#3a5c38",
              border: "1px solid #4ade80",
              borderRadius: 6,
              color: "#d8e8ce",
              padding: "11px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "var(--font-sans)",
              marginTop: 4,
              boxShadow: "0 4px 12px rgba(74, 222, 128, 0.15)",
            }}
          >
            {loading ? <Spinner size={14} /> : null}
            {loading ? "Authenticating Swarm Node..." : "Launch Swarm Dashboard"}
          </button>
        </form>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setEmail("lead.auditor@swarm.tax");
              setPassword("swarm-audit-2026");
              login("lead.auditor@swarm.tax", "swarm-audit-2026");
            }}
            className="button-interactive"
            style={{
              background: "#293724",
              border: "1px solid #3a4c34",
              borderRadius: 6,
              color: "#4ade80",
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "var(--font-sans)",
            }}
          >
            <span>⚡</span> Quick Demo Sign-In (Lead Auditor)
          </button>

          <div style={{ padding: "8px 12px", background: "#1b2318", borderRadius: 6, border: "1px solid #2d3d27" }}>
            <div style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)", textAlign: "center" }}>
              Autonomous 3-Agent Swarm: Extractor • Reconciler • Filer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
