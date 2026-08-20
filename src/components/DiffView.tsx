import { useState } from "react";
import { fmt } from "./shared";

interface Props {
  originalLiability: number;
  adjustedLiability: number;
  label?: string;
}

export default function DiffView({ originalLiability, adjustedLiability, label = "Sandbox Diff View" }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const diff = adjustedLiability - originalLiability;
  const diffColor = diff > 0 ? "#ef4444" : "#4ade80";
  const diffSign = diff > 0 ? "+" : "";

  return (
    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        {/* Original */}
        <div
          className="interactive-hover"
          style={{ flex: 1, background: "#1b2318", border: "1px solid #3a4c34", borderRadius: 6, padding: "12px 14px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span
              style={{
                display: "inline-block",
                background: "#293724",
                border: "1px solid #3a4c34",
                borderRadius: 4,
                padding: "2px 10px",
                color: "#7a9a70",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Original Ledger Liability
            </span>
            <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>GSTR-3B Baseline</span>
          </div>

          <div style={{ color: "#7a9a70", fontSize: 11, marginBottom: 4 }}>
            Unadjusted: <span style={{ color: "#d8e8ce", fontFamily: "var(--font-mono)" }}>₹{(originalLiability / 1e7).toFixed(2)}Cr</span>
          </div>
          <div style={{ color: "#d8e8ce", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: 8 }}>
            {fmt(originalLiability)}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: "flex", alignItems: "center", color: "#4ade80", fontSize: 20, opacity: 0.7 }}>›</div>

        {/* Swarm Adjusted */}
        <div
          className="interactive-hover"
          style={{ flex: 1, background: "#1b2318", border: "1px solid #2dd4bf55", borderRadius: 6, padding: "12px 14px", boxShadow: "0 0 12px rgba(45, 212, 191, 0.1)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span
              style={{
                display: "inline-block",
                background: "#1a3d38",
                border: "1px solid #2dd4bf",
                borderRadius: 4,
                padding: "2px 10px",
                color: "#2dd4bf",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Swarm Consensus Adjusted
            </span>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="button-interactive"
              style={{
                background: "transparent",
                border: "none",
                color: "#2dd4bf",
                fontSize: 10,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {showBreakdown ? "Hide Details" : "View Breakdown"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ color: "#7a9a70", fontSize: 11, marginBottom: 4 }}>
                Consensus Net: <span style={{ color: "#d8e8ce", fontFamily: "var(--font-mono)" }}>₹{(adjustedLiability / 1e7).toFixed(2)}Cr</span>
              </div>
              <div style={{ color: "#d8e8ce", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {fmt(adjustedLiability)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#4a6442", fontSize: 10 }}>Net Variance</div>
              <div style={{ color: diffColor, fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {diffSign}{fmt(Math.abs(diff))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Variance Breakdown */}
      {showBreakdown && (
        <div
          className="animate-slide-in"
          style={{
            background: "#222d1d",
            border: "1px solid #3a4c34",
            borderRadius: 6,
            padding: "8px 12px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
          }}
        >
          <div>
            <span style={{ color: "#4a6442", display: "block" }}>ITC Ineligible (Rule 37):</span>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>+₹1,85,00,000</span>
          </div>
          <div>
            <span style={{ color: "#4a6442", display: "block" }}>Rate Mismatch Delta:</span>
            <span style={{ color: "#eab308", fontWeight: 600 }}>+₹75,00,000</span>
          </div>
          <div>
            <span style={{ color: "#4a6442", display: "block" }}>Unclaimed ITC Reclaim:</span>
            <span style={{ color: "#4ade80", fontWeight: 600 }}>-₹20,00,000</span>
          </div>
        </div>
      )}
    </div>
  );
}
