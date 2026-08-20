import { Fragment, useState } from "react";
import { Button, SeverityBadge, ConfidenceBar, LoadingState, EmptyState, ErrorState, fmt } from "./shared";
import type { Exception } from "../types";

interface Props {
  exceptions: Exception[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onExport?: () => void;
  onSelect?: (ex: Exception) => void;
  selectedId?: string;
}

export default function ExceptionVortex({ exceptions, loading, error, onRetry, onExport, onSelect, selectedId }: Props) {
  const [threshold, setThreshold] = useState(70);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  function handleExportCSV() {
    if (onExport) {
      onExport();
      return;
    }
    const headers = ["ID", "Vendor Name", "GSTIN", "Mismatch Amount", "Root Cause", "Confidence Score", "Severity"];
    const rows = filtered.map((e) => [
      e.id,
      `"${e.vendor_name}"`,
      e.gstin ?? "",
      e.mismatch_amount,
      `"${e.root_cause}"`,
      `${e.confidence_score}%`,
      e.severity,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tax-audit-exceptions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleResolve(id: string) {
    setResolvedIds((prev) => new Set([...prev, id]));
  }

  const activeExceptions = exceptions.filter((e) => !resolvedIds.has(e.id));
  const filtered = activeExceptions.filter(
    (ex) => ex.confidence_score >= threshold && (severityFilter === "all" || ex.severity === severityFilter)
  );

  const totalMismatch = filtered.reduce((s, e) => s + e.mismatch_amount, 0);

  if (loading) return <LoadingState label="Loading exceptions..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderBottom: "1px solid #2d3d27", flexWrap: "wrap", background: "#1b2318" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 260 }}>
          <span style={{ color: "#7a9a70", fontSize: 11 }}>Confidence Filter:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ width: 110, accentColor: "#4ade80", cursor: "pointer" }}
          />
          <span style={{ color: "#4ade80", fontSize: 11, fontFamily: "var(--font-mono)", minWidth: 36, fontWeight: 600 }}>≥{threshold}%</span>
        </div>

        {/* Severity Filter Pills */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>Severity:</span>
          {["all", "crit", "high", "med"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className="button-interactive"
              style={{
                background: severityFilter === sev ? "#293724" : "transparent",
                border: severityFilter === sev ? "1px solid #3a4c34" : "1px solid transparent",
                borderRadius: 4,
                color: severityFilter === sev ? (sev === "crit" ? "#ef4444" : sev === "high" ? "#f97316" : sev === "med" ? "#eab308" : "#d8e8ce") : "#7a9a70",
                padding: "2px 6px",
                fontSize: 10,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
              }}
            >
              {sev}
            </button>
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={handleExportCSV}>⬇ Export CSV</Button>
      </div>

      {/* Table */}
      {!filtered.length ? (
        <EmptyState label="No exceptions match the confidence threshold or severity filter" icon="✓" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "var(--font-sans)" }}>
            <thead>
              <tr style={{ background: "#1f2a1b" }}>
                {["Vendor Name", "Mismatch (₹)", "Root Cause", "Swarm Confidence Score (%)"].map((h) => (
                  <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: "#7a9a70", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #2d3d27", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
                <th style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex) => (
                <Fragment key={ex.id}>
                  <tr
                    onClick={() => { onSelect?.(ex); setExpandedId(expandedId === ex.id ? null : ex.id); }}
                    className="interactive-hover"
                    style={{
                      borderBottom: "1px solid #2d3d27",
                      cursor: "pointer",
                      background: selectedId === ex.id ? "#293724" : "transparent",
                    }}
                  >
                    <td style={{ padding: "9px 12px", color: "#d8e8ce", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <SeverityBadge severity={ex.severity} />
                        <span>{ex.vendor_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "9px 12px", color: "#eab308", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {fmt(ex.mismatch_amount)}
                    </td>
                    <td style={{ padding: "9px 12px", color: "#7a9a70" }}>{ex.root_cause}</td>
                    <td style={{ padding: "9px 12px", minWidth: 160 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ConfidenceBar value={ex.confidence_score} />
                      </div>
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 400 }}>
                        {expandedId === ex.id ? "▼" : "›"}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === ex.id && (
                    <tr style={{ background: "#1b2318", borderBottom: "1px solid #2d3d27" }}>
                      <td colSpan={5} style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
                          {/* Constraint info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#7a9a70", fontSize: 11, marginBottom: 6 }}>
                              Swarm Consensus Diagnostics: Mismatch of <span style={{ color: "#eab308", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmt(ex.mismatch_amount)}</span> identified by Reconciler Node.
                            </div>
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                              <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>
                                GSTIN: <span style={{ color: "#d8e8ce" }}>{ex.gstin ?? "27AADCA0325R1Z6"}</span>
                              </span>
                              <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>
                                Discrepancy: <span style={{ color: "#ef4444" }}>GSTR-2A vs GSTR-3B Table 4(A)</span>
                              </span>
                            </div>
                          </div>

                          {/* Quick Resolution Actions */}
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleResolve(ex.id); }}
                              className="button-interactive"
                              style={{
                                background: "#1a3d2a",
                                border: "1px solid #4ade80",
                                borderRadius: 5,
                                padding: "4px 10px",
                                color: "#4ade80",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              ✓ Accept Reconciled
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onSelect?.(ex); }}
                              className="button-interactive"
                              style={{
                                background: "#293724",
                                border: "1px solid #3a4c34",
                                borderRadius: 5,
                                padding: "4px 10px",
                                color: "#d8e8ce",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              Open in Dispatch →
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div style={{ padding: "7px 14px", borderTop: "1px solid #2d3d27", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1f2a1b" }}>
          <span style={{ color: "#4a6442", fontSize: 11 }}>
            {filtered.length} exception{filtered.length !== 1 ? "s" : ""} meeting filter criteria
          </span>
          <span style={{ color: "#7a9a70", fontSize: 11 }}>
            Total mismatch impact: <span style={{ color: "#eab308", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmt(totalMismatch)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
