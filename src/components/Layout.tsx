import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getHealth } from "../api";
import type { NavPage, HealthStatus } from "../types";

interface LayoutProps {
  children: ReactNode;
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const navItems: { page: NavPage; icon: string; label: string }[] = [
  { page: "dashboard", icon: "▦", label: "Dashboard" },
  { page: "invoices", icon: "◉", label: "Invoices" },
  { page: "vendors", icon: "⬡", label: "Vendors" },
  { page: "knowledge-base", icon: "⚙", label: "Knowledge Base" },
  { page: "ledgers", icon: "≡", label: "Ledgers" },
  { page: "bank-transactions", icon: "⇄", label: "Bank Transactions" },
  { page: "reports", icon: "↗", label: "Reports" },
  { page: "settings", icon: "✦", label: "Settings" },
];

export default function Layout({ children, activePage, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [tooltip, setTooltip] = useState<{ page: NavPage; label: string } | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    function fetchHealth() {
      getHealth()
        .then(setHealth)
        .catch(() => setHealth({ status: "down" }));
    }
    fetchHealth();
    interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const healthColor = !health
    ? "#7a9a70"
    : health.status === "healthy"
    ? "#4ade80"
    : health.status === "degraded"
    ? "#eab308"
    : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1b2318", overflow: "hidden" }}>
      {/* Header */}
      <header
        style={{
          height: 40,
          background: "#1b2318",
          borderBottom: "1px solid #3a4c34",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          flexShrink: 0,
          gap: 16,
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 24,
              height: 24,
              background: "linear-gradient(135deg, #4ade80, #22d3ee)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 10px rgba(74, 222, 128, 0.4)",
            }}
          >
            <span style={{ color: "#0d1f0a", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>⚡</span>
          </div>
          <span style={{ color: "#d8e8ce", fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.02em" }}>
            Autonomous Tax Audit Swarm <span style={{ color: "#4a6442", fontWeight: 400 }}>v2.4</span>
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Swarm Run Mode Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#222d1d",
            border: "1px solid #3a4c34",
            borderRadius: 12,
            padding: "2px 10px",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} className="animate-pulse" />
          <span style={{ color: "#4ade80", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.05em" }}>
            SWARM RUNNING • 3/3 NODES
          </span>
        </div>

        {/* Health */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
          <span style={{ color: "#7a9a70", fontSize: 11, fontFamily: "var(--font-mono)" }}>
            Engine:{" "}
            <span style={{ color: healthColor, fontWeight: 600 }}>{health?.status === "healthy" ? "Healthy" : health?.status ?? "Online"}</span>
          </span>
        </div>

        <div style={{ width: 1, height: 16, background: "#3a4c34" }} />

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#293724", border: "1px solid #4ade80", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ade80", fontSize: 9, fontWeight: 700 }}>
              {(user?.username?.[0] ?? "A").toUpperCase()}
            </div>
            <span style={{ color: "#7a9a70", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              {user?.email ?? "lead.auditor@swarm.tax"}
            </span>
          </div>
          <button
            onClick={logout}
            className="button-interactive"
            style={{ background: "#222d1d", border: "1px solid #3a4c34", borderRadius: 4, color: "#7a9a70", fontSize: 11, padding: "2px 8px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <nav
          style={{
            width: 56,
            background: "#1b2318",
            borderRight: "1px solid #3a4c34",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 12,
            paddingBottom: 12,
            gap: 4,
            flexShrink: 0,
            position: "relative",
          }}
        >
          {navItems.map((item) => {
            const active = activePage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                onMouseEnter={() => setTooltip(item)}
                onMouseLeave={() => setTooltip(null)}
                style={{
                  width: 38,
                  height: 38,
                  background: active ? "#293724" : "transparent",
                  border: active ? "1px solid #3a4c34" : "1px solid transparent",
                  borderRadius: 7,
                  color: active ? "#4ade80" : "#4a6442",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {item.icon}
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      left: -1,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 3,
                      height: 20,
                      background: "#4ade80",
                      borderRadius: "0 2px 2px 0",
                    }}
                  />
                )}
              </button>
            );
          })}

          {/* Tooltip */}
          {tooltip && (
            <div
              className="animate-fade-in"
              style={{
                position: "absolute",
                left: 58,
                top: navItems.findIndex((i) => i.page === tooltip.page) * 42 + 12,
                background: "#293724",
                border: "1px solid #3a4c34",
                borderRadius: 5,
                padding: "4px 10px",
                color: "#d8e8ce",
                fontSize: 12,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 50,
                boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontWeight: 600 }}>{tooltip.label}</div>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Notifications button with badge */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => onNavigate("invoices")}
              title="Swarm Exceptions & Alerts"
              className="button-interactive"
              style={{
                width: 38,
                height: 38,
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: 7,
                color: "#7a9a70",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                position: "relative",
              }}
            >
              🔔
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  background: "#ef4444",
                  borderRadius: "50%",
                  boxShadow: "0 0 6px #ef4444",
                }}
              />
            </button>
          </div>
        </nav>

        {/* Page content */}
        <main style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
