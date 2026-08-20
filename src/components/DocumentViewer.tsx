import type { Invoice } from "../types";
import { fmt, fmtDate } from "./shared";

interface Props {
  invoice?: Invoice | null;
}

export default function DocumentViewer({ invoice }: Props) {
  if (!invoice) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1b2318",
          border: "1px solid #2d3d27",
          borderRadius: 6,
          margin: 14,
          padding: 24,
          gap: 12,
        }}
      >
        {/* Mock document preview */}
        <svg width={80} height={100} viewBox="0 0 80 100">
          <rect x={5} y={5} width={70} height={90} rx={4} fill="#222d1d" stroke="#3a4c34" strokeWidth={1} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={14} y={20 + i * 10} width={30 + (i % 3) * 10} height={4} rx={2} fill="#3a4c34" />
          ))}
          <rect x={14} y={78} width={28} height={12} rx={3} fill="#293724" stroke="#4ade8030" />
          {/* Signature scribble */}
          <path d="M18 87 Q22 83 26 86 Q30 89 34 84" stroke="#4ade80" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          {/* Fingerprint circle */}
          <circle cx={56} cy={84} r={8} fill="#1a3d38" stroke="#2dd4bf40" strokeWidth={1} />
          <path d="M52 84 Q54 80 56 84 Q58 88 60 84" stroke="#2dd4bf" strokeWidth={0.8} fill="none" strokeLinecap="round" />
        </svg>
        <span style={{ color: "#4a6442", fontSize: 11, fontFamily: "var(--font-mono)" }}>No document selected</span>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#1b2318",
        border: "1px solid #2d3d27",
        borderRadius: 6,
        margin: 14,
        overflow: "hidden",
      }}
    >
      {/* Doc header */}
      <div style={{ background: "#222d1d", borderBottom: "1px solid #2d3d27", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#7a9a70", fontSize: 10, fontFamily: "var(--font-mono)" }}>INVOICE PREVIEW</span>
        <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>{invoice.invoice_number}</span>
      </div>

      {/* Simulated document */}
      <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
        <div
          style={{
            background: "#0d1f0a",
            border: "1px solid #293724",
            borderRadius: 4,
            padding: 16,
            minHeight: 200,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: "1px solid #293724", paddingBottom: 10, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 12, marginBottom: 2 }}>TAX INVOICE</div>
              <div style={{ color: "#4a6442" }}>No: {invoice.invoice_number}</div>
              <div style={{ color: "#4a6442" }}>Date: {fmtDate(invoice.invoice_date)}</div>
            </div>
            {invoice.mismatch_amount ? (
              <span style={{ background: "#3d1a1a", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 3, padding: "2px 6px", fontSize: 9, fontWeight: 700 }}>
                ⚠ {invoice.root_cause ?? "MISMATCH DETECTED"}
              </span>
            ) : (
              <span style={{ background: "#1a3d2a", color: "#4ade80", border: "1px solid #4ade80", borderRadius: 3, padding: "2px 6px", fontSize: 9, fontWeight: 700 }}>
                ✓ OCR &amp; GSTR-2B VERIFIED
              </span>
            )}
          </div>

          {/* Vendor info */}
          <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#7a9a70", marginBottom: 2 }}>From:</div>
              <div style={{ color: "#d8e8ce", fontWeight: 600 }}>{invoice.vendor_name}</div>
              <div style={{ color: "#4a6442" }}>GSTIN: {invoice.vendor_gstin}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#7a9a70", marginBottom: 2 }}>Swarm Integrity:</div>
              <div style={{ color: "#4ade80", fontWeight: 700 }}>{invoice.confidence_score}%</div>
            </div>
          </div>

          {/* Line items placeholder */}
          <div style={{ borderTop: "1px solid #293724", paddingTop: 8, marginTop: 8 }}>
            {["Description", "Qty", "Rate", "Amount"].map((h) => (
              <span key={h} style={{ color: "#4a6442", display: "inline-block", width: "25%", fontSize: 9 }}>{h}</span>
            ))}
            <div style={{ height: 1, background: "#293724", margin: "4px 0" }} />
            <div style={{ color: "#7a9a70" }}>
              <span style={{ display: "inline-block", width: "25%" }}>Services</span>
              <span style={{ display: "inline-block", width: "25%" }}>1</span>
              <span style={{ display: "inline-block", width: "25%" }}>{fmt(invoice.amount)}</span>
              <span style={{ display: "inline-block", width: "25%" }}>{fmt(invoice.amount)}</span>
            </div>
          </div>

          {/* Totals */}
          <div style={{ borderTop: "1px solid #293724", paddingTop: 8, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#4a6442" }}>Subtotal</span>
              <span style={{ color: "#7a9a70" }}>{fmt(invoice.amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#4a6442" }}>GST</span>
              <span style={{ color: "#7a9a70" }}>{fmt(invoice.gst_amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #293724", paddingTop: 4, marginTop: 4 }}>
              <span style={{ color: "#4ade80", fontWeight: 600 }}>Total</span>
              <span style={{ color: "#4ade80", fontWeight: 600 }}>{fmt(invoice.amount + invoice.gst_amount)}</span>
            </div>
          </div>

          {/* Signature */}
          <div style={{ borderTop: "1px solid #293724", marginTop: 16, paddingTop: 10, display: "flex", justifyContent: "flex-end", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 60, height: 20, borderBottom: "1px solid #3a4c34", marginBottom: 2 }}>
                <svg width={60} height={20} viewBox="0 0 60 20">
                  <path d="M5 15 Q15 5 25 12 Q35 18 45 8 Q50 4 55 12" stroke="#4ade80" strokeWidth={1} fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ color: "#4a6442", fontSize: 9 }}>Authorised Signatory</div>
            </div>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1px solid #2dd4bf40",
                background: "#1a3d38",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={16} height={16} viewBox="0 0 16 16">
                <circle cx={8} cy={8} r={6} stroke="#2dd4bf" strokeWidth={0.5} fill="none" />
                <ellipse cx={8} cy={8} rx={3} ry={5} stroke="#2dd4bf" strokeWidth={0.5} fill="none" />
                <line x1={2} y1={8} x2={14} y2={8} stroke="#2dd4bf" strokeWidth={0.5} />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
