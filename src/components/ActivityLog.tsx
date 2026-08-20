import { useEffect, useRef, useState } from "react";
import { connectAuditLogs } from "../api";
import { Button } from "./shared";
import type { LogEntry } from "../types";

const MOCK_LOGS: LogEntry[] = [
  { timestamp: "14:23:01", message: "Reconciler: Found 12 missing credits from Vendor X. Recalculating...", level: "info", agent: "reconciler" },
  { timestamp: "14:23:01", message: "Agent Filer: Recalculate for GSTR-3B delayed filing...", level: "warn", agent: "filer" },
  { timestamp: "14:22:48", message: "Extractor: Parsed 34 line items from invoice INV-2024-0892", level: "info", agent: "extractor" },
  { timestamp: "14:22:33", message: "Reconciler: GSTIN mismatch detected for Apex Corp. — 27AADCA0325R1Z6", level: "warn", agent: "reconciler" },
];

interface Props {
  invoiceId?: string;
}

const levelColor: Record<string, string> = {
  info: "#7a9a70",
  warn: "#eab308",
  error: "#ef4444",
};

const agentColor: Record<string, string> = {
  extractor: "#60a5fa",
  reconciler: "#a78bfa",
  filer: "#2dd4bf",
};

const SIMULATED_STREAM_EVENTS = [
  { agent: "reconciler", level: "info" as const, message: "Reconciler: Cross-referencing e-way bills with GSTR-2B Table 4(A)..." },
  { agent: "filer", level: "info" as const, message: "Filer: Generating ITC discrepancy payload for GSTR-3B return..." },
  { agent: "extractor", level: "info" as const, message: "Extractor: OCR parsing tax invoice fields & line item rates for HSN-8471..." },
  { agent: "reconciler", level: "warn" as const, message: "Reconciler: ITC reversal flagged under Rule 37 (180-day non-payment rule)." },
  { agent: "reconciler", level: "info" as const, message: "Reconciler: Vendor Nova Enterprises verified. 100% GSTR-1 matched." },
  { agent: "reconciler", level: "error" as const, message: "Reconciler: Circular Trading Pvt Ltd flagged: Mismatch of ₹4,50,000 in ITC claim." },
  { agent: "filer", level: "info" as const, message: "Filer: Updated draft tax liability for Nov 2024 (CGST: ₹1.4Cr, SGST: ₹1.4Cr)." },
  { agent: "extractor", level: "info" as const, message: "Extractor: Verified digital signature hash & IRN against GSTN gateway." },
  { agent: "filer", level: "info" as const, message: "Filer: Swarm consensus sealed across 3 nodes. Ready for dispatch." },
];

export default function ActivityLog({ invoiceId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const [wsConnected, setWsConnected] = useState(false);
  const [checkpoints, setCheckpoints] = useState<number[]>([]);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = connectAuditLogs(
      (entry) => {
        setLogs((prev) => [
          ...prev.slice(-199),
          {
            timestamp: new Date(entry.timestamp).toLocaleTimeString("en-IN", { hour12: false }),
            message: entry.message,
            level: (entry.level as LogEntry["level"]) || "info",
            agent: entry.agent,
          },
        ]);
      },
      setWsConnected
    );
    return cleanup;
  }, [invoiceId]);

  // Standalone simulation stream: live agent activity every 2.5 seconds
  useEffect(() => {
    if (wsConnected) return;
    let streamIdx = 0;
    const interval = setInterval(() => {
      const item = SIMULATED_STREAM_EVENTS[streamIdx % SIMULATED_STREAM_EVENTS.length];
      streamIdx++;
      const newEntry: LogEntry = {
        timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
        message: item.message,
        level: item.level,
        agent: item.agent,
      };
      setLogs((prev) => [...prev.slice(-199), newEntry]);
    }, 2500);
    return () => clearInterval(interval);
  }, [wsConnected]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs.length, autoScroll]);

  function handleUndo() {
    if (checkpoints.length === 0) return;
    const cp = checkpoints[checkpoints.length - 1];
    setLogs((prev) => prev.slice(0, cp));
    setCheckpoints((prev) => prev.slice(0, -1));
  }

  function handleCheckpoint() {
    setCheckpoints((prev) => [...prev, logs.length]);
  }

  function handleCopy(entry: LogEntry, idx: number) {
    const text = `[${entry.timestamp}] ${entry.agent ? `${entry.agent}: ` : ""}${entry.message}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  const filteredLogs = logs.filter((l) => {
    if (agentFilter !== "all" && l.agent !== agentFilter) return false;
    if (levelFilter !== "all" && l.level !== levelFilter) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar & Filters */}
      <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #2d3d27", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
              }}
              className="animate-pulse"
            />
            <span style={{ color: "#4ade80", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {wsConnected ? "WebSocket Live" : "Swarm Stream Active"}
            </span>
            <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>— {filteredLogs.length} entries</span>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              title={autoScroll ? "Disable Auto-scroll" : "Enable Auto-scroll"}
              className="button-interactive"
              style={{
                background: autoScroll ? "#293724" : "transparent",
                border: "1px solid #3a4c34",
                borderRadius: 4,
                color: autoScroll ? "#4ade80" : "#7a9a70",
                fontSize: 10,
                padding: "2px 6px",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
              }}
            >
              {autoScroll ? "↓ Auto-scroll ON" : "⏸ Auto-scroll OFF"}
            </button>
            <Button variant="ghost" size="sm" onClick={handleUndo} disabled={checkpoints.length === 0}>
              ↩ Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCheckpoint}>
              ⚑ Checkpoint
            </Button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 14px 6px", background: "#1b2318", borderTop: "1px solid #2d3d27", flexWrap: "wrap" }}>
          <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>Agent:</span>
          {["all", "extractor", "reconciler", "filer"].map((ag) => (
            <button
              key={ag}
              onClick={() => setAgentFilter(ag)}
              className="button-interactive"
              style={{
                background: agentFilter === ag ? "#293724" : "transparent",
                border: agentFilter === ag ? "1px solid #4ade8055" : "1px solid transparent",
                borderRadius: 4,
                color: agentFilter === ag ? "#4ade80" : "#7a9a70",
                fontSize: 10,
                padding: "1px 6px",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                textTransform: "capitalize",
              }}
            >
              {ag}
            </button>
          ))}

          <div style={{ width: 1, height: 12, background: "#3a4c34", margin: "0 4px" }} />

          <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>Level:</span>
          {["all", "info", "warn", "error"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className="button-interactive"
              style={{
                background: levelFilter === lvl ? "#293724" : "transparent",
                border: levelFilter === lvl ? "1px solid #3a4c34" : "1px solid transparent",
                borderRadius: 4,
                color: levelFilter === lvl ? (lvl === "error" ? "#ef4444" : lvl === "warn" ? "#eab308" : "#d8e8ce") : "#7a9a70",
                fontSize: 10,
                padding: "1px 6px",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {filteredLogs.length === 0 ? (
          <div style={{ color: "#4a6442", fontSize: 11, fontFamily: "var(--font-mono)", padding: "16px 14px", textAlign: "center" }}>
            No log entries match the selected filters.
          </div>
        ) : (
          filteredLogs.map((entry, i) => (
            <div
              key={i}
              onClick={() => handleCopy(entry, i)}
              title="Click to copy log line"
              className="interactive-hover"
              style={{
                display: "flex",
                gap: 10,
                padding: "3px 14px",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                lineHeight: 1.5,
                background: i === filteredLogs.length - 1 ? "#242f1f" : "transparent",
                borderLeft: entry.level === "error" ? "2px solid #ef4444" : entry.level === "warn" ? "2px solid #eab308" : "2px solid transparent",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <span style={{ color: "#4a6442", flexShrink: 0, minWidth: 56 }}>[{entry.timestamp}]</span>
              {entry.agent && (
                <span style={{ color: agentColor[entry.agent] ?? "#7a9a70", flexShrink: 0, minWidth: 72, textTransform: "capitalize", fontWeight: 500 }}>
                  {entry.agent}:
                </span>
              )}
              <span style={{ color: levelColor[entry.level] ?? "#7a9a70", flex: 1 }}>{entry.message}</span>
              {copiedIndex === i && (
                <span style={{ color: "#4ade80", fontSize: 9, background: "#1a3d2a", border: "1px solid #4ade80", borderRadius: 3, padding: "0 4px" }}>
                  copied!
                </span>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
