import { useState, useEffect, useCallback } from "react";
import AgentWorkflow from "../components/AgentWorkflow";
import ExceptionVortex from "../components/ExceptionVortex";
import DiffView from "../components/DiffView";
import ActivityLog from "../components/ActivityLog";
import ActionPanel from "../components/ActionPanel";
import DocumentViewer from "../components/DocumentViewer";
import { Panel, StatsCard, LoadingState, fmt } from "../components/shared";
import { getDashboardStats, getExceptions, getInvoices } from "../api";
import type { DashboardStats, Exception, Invoice } from "../types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [excLoading, setExcLoading] = useState(true);
  const [excError, setExcError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedEx, setSelectedEx] = useState<Exception | null>(null);
  const [topologyInvoice, setTopologyInvoice] = useState<Invoice | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getDashboardStats();
      setStats(s);
    } catch {
      // Use mock stats on error
      setStats({
        total_invoices: 4847,
        audited_invoices: 3920,
        pending_invoices: 927,
        exceptions_count: 38,
        total_liability: 250000000,
        adjusted_liability: 280000000,
        confidence_avg: 94,
        processing_speed: 1450,
        token_usage: 78000,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadExceptions = useCallback(async () => {
    setExcLoading(true);
    setExcError("");
    try {
      const excs = await getExceptions();
      if (excs.length === 0) {
        // Use mock exceptions
        setExceptions(MOCK_EXCEPTIONS);
      } else {
        setExceptions(excs);
      }
    } catch {
      setExceptions(MOCK_EXCEPTIONS);
    } finally {
      setExcLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadExceptions();
    // Load a representative invoice for topology
    getInvoices({ limit: "1" })
      .then((invs) => { if (invs.length) setTopologyInvoice(invs[0]); })
      .catch(() => setTopologyInvoice(MOCK_INVOICE));
  }, [loadStats, loadExceptions]);

  function handleSelectException(ex: Exception) {
    setSelectedEx(ex);
    // Dynamically update Selected Audit Focus panel on the left
    setSelectedInvoice({
      invoice_id: ex.invoice_id || `INV-${ex.id}`,
      vendor_name: ex.vendor_name,
      vendor_gstin: ex.gstin || (ex.vendor_name.includes("Circular") ? "07AADCC0789Q1Z1" : ex.vendor_name.includes("Nova") ? "29AADCN0123K1Z9" : ex.vendor_name.includes("Bharat") ? "24AADCB0456P1Z3" : "27AADCA0325R1Z6"),
      invoice_number: ex.invoice_id.startsWith("INV-") ? ex.invoice_id : `INV-2024-${ex.invoice_id.padStart(4, "0")}`,
      invoice_date: "2024-11-15",
      amount: ex.mismatch_amount * 10,
      gst_amount: ex.mismatch_amount * 1.8,
      status: "exception",
      confidence_score: ex.confidence_score,
      mismatch_amount: ex.mismatch_amount,
      root_cause: ex.root_cause,
      created_at: new Date().toISOString(),
    });
  }

  const currentInvoice = selectedInvoice ?? topologyInvoice ?? null;

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Left topology panel */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: "1px solid #3a4c34",
          background: "#1f2a1b",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div style={{ padding: "9px 12px", borderBottom: "1px solid #2d3d27", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 12 }}>Swarm Topology</span>
          <span style={{ color: "#4ade80", fontSize: 11, fontFamily: "var(--font-mono)" }}>LIVE</span>
        </div>

        {/* Topology section */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #2d3d27" }}>
          <div style={{ color: "#7a9a70", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
            Selected Audit Focus
          </div>

          {/* Vendor / Invoice details */}
          {currentInvoice ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                ["Vendor Name", currentInvoice.vendor_name],
                ["Invoice No", currentInvoice.invoice_number],
                ["Mismatch", currentInvoice.mismatch_amount ? fmt(currentInvoice.mismatch_amount) : "—"],
                ["Root Cause", currentInvoice.root_cause ?? "100% GSTR-2B Matched"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: "#4a6442", fontSize: 10, display: "block" }}>{k}:</span>
                  <span style={{ color: "#d8e8ce", fontSize: 11, fontFamily: "var(--font-mono)", display: "block", wordBreak: "break-all" }}>{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <LoadingState label="Loading..." />
          )}
        </div>

        {/* Agent state */}
        {stats && (
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #2d3d27" }}>
            {[
              ["Swarm Speed", `${(stats.processing_speed / 1000).toFixed(1)}k inv/min`],
              ["Token Usage", `${Math.round(stats.token_usage / 1000)}k / cycle`],
              ["Architecture", "3-Agent Swarm"],
              ["Consensus State", "Active Verification"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <span style={{ color: "#4a6442", fontSize: 10 }}>{k}:</span>
                <span style={{ color: "#7a9a70", fontSize: 10, fontFamily: "var(--font-mono)" }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {statsLoading ? (
          <LoadingState label="Loading stats..." />
        ) : (
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Total Invoices", value: stats?.total_invoices.toLocaleString() ?? "—" },
              { label: "Swarm Audited", value: stats?.audited_invoices.toLocaleString() ?? "—", color: "#4ade80" },
              { label: "Pending Queue", value: stats?.pending_invoices.toLocaleString() ?? "—", color: "#eab308" },
              { label: "Exceptions", value: stats?.exceptions_count.toLocaleString() ?? "—", color: "#ef4444" },
              { label: "Swarm Confidence", value: `${stats?.confidence_avg ?? 0}%`, color: "#2dd4bf" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#4a6442", fontSize: 10 }}>{item.label}</span>
                <span style={{ color: item.color ?? "#d8e8ce", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tooltip hint */}
        <div style={{ margin: 12, background: "#293724", border: "1px solid #3a4c34", borderRadius: 5, padding: "8px 10px" }}>
          <div style={{ color: "#7a9a70", fontSize: 10, fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
            Autonomous swarm nodes continuously verify multi-party ledger consensus and GST compliance.
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Bottom icons */}
        <div style={{ padding: "8px 12px", borderTop: "1px solid #2d3d27", display: "flex", gap: 8 }}>
          {["🔔", "⚙", "↗"].map((ic) => (
            <button
              key={ic}
              className="button-interactive"
              style={{ background: "none", border: "none", color: "#7a9a70", fontSize: 14, cursor: "pointer", padding: 4 }}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Center content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {/* Swarm State */}
        <Panel
          title="Autonomous Swarm State"
          actions={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} className="animate-pulse" />
              <span style={{ color: "#4ade80", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600 }}>3 Nodes Synced</span>
            </div>
          }
          style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", flexShrink: 0 }}
        >
          <AgentWorkflow />
        </Panel>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, padding: "8px 14px", borderBottom: "1px solid #2d3d27", flexShrink: 0 }}>
          <StatsCard label="Total Invoices" value={stats?.total_invoices.toLocaleString() ?? "—"} icon="◉" />
          <StatsCard label="Exceptions" value={stats?.exceptions_count ?? "—"} color="#ef4444" icon="⚠" />
          <StatsCard label="Confidence" value={`${stats?.confidence_avg ?? 0}%`} color="#2dd4bf" icon="◎" />
          <StatsCard label="Pending" value={stats?.pending_invoices.toLocaleString() ?? "—"} color="#eab308" icon="⏳" />
        </div>

        {/* Exception Vortex */}
        <Panel
          title="Exception Vortex"
          actions={
            <span style={{ color: "#7a9a70", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              {exceptions.length} Active Discrepancies
            </span>
          }
          style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", flexShrink: 0 }}
        >
          <ExceptionVortex
            exceptions={exceptions}
            loading={excLoading}
            error={excError}
            onRetry={loadExceptions}
            onSelect={handleSelectException}
            selectedId={selectedEx?.id}
          />
        </Panel>

        {/* Diff view */}
        <Panel
          title="Swarm Sandbox Diff View"
          actions={
            <span style={{ color: "#2dd4bf", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              Consensus Adjusted Liability
            </span>
          }
          style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", flexShrink: 0 }}
        >
          <DiffView
            originalLiability={stats?.total_liability ?? 250000000}
            adjustedLiability={stats?.adjusted_liability ?? 280000000}
          />
        </Panel>

        {/* Narrative Log */}
        <Panel
          title="Swarm Narrative Log"
          actions={
            <span style={{ color: "#7a9a70", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              Multi-Agent Audit Trail
            </span>
          }
          style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", flex: 1, minHeight: 180 }}
          bodyStyle={{ display: "flex", flexDirection: "column" }}
        >
          <ActivityLog />
        </Panel>
      </div>

      {/* Right action panel */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          borderLeft: "1px solid #3a4c34",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#1f2a1b",
        }}
      >
        {/* Handshake header */}
        <div style={{ padding: "9px 14px", borderBottom: "1px solid #2d3d27", background: "#1b2318", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 13 }}>Swarm Dispatch &amp; Handshake</span>
          <span style={{ color: "#4ade80", fontSize: 10, fontFamily: "var(--font-mono)" }}>● READY</span>
        </div>

        {/* Action panel */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <ActionPanel
            invoice={selectedInvoice}
            exception={selectedEx}
            onAuditComplete={() => { loadStats(); loadExceptions(); }}
          />
          <DocumentViewer invoice={currentInvoice} />
        </div>

        {/* Bottom hint */}
        <div
          style={{
            padding: "8px 12px",
            borderTop: "1px solid #2d3d27",
            background: "#1b2318",
            margin: "0 12px 12px",
            borderRadius: 5,
            border: "1px solid #2d3d27",
          }}
        >
          <div style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>
            Hovering over any Agent Node triggers Resource metrics.
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data fallbacks
const MOCK_INVOICE: Invoice = {
  invoice_id: "INV-001",
  vendor_name: "Apex Corp.",
  vendor_gstin: "27AADCA0325R1Z6",
  invoice_number: "INV-2024-0892",
  invoice_date: "2024-11-15",
  amount: 4500000,
  gst_amount: 810000,
  status: "exception",
  confidence_score: 82,
  mismatch_amount: 450000,
  root_cause: "GSTR-1 not filed",
  created_at: "2024-11-15T09:30:00Z",
};

const MOCK_EXCEPTIONS: Exception[] = [
  { id: "1", vendor_name: "Apex Corp.", invoice_id: "INV-2024-0892", mismatch_amount: 450000, root_cause: "GSTR-1 not filed", confidence_score: 94, severity: "high", gstin: "27AADCA0325R1Z6" },
  { id: "2", vendor_name: "Circular Trading Pvt Ltd", invoice_id: "INV-2024-1104", mismatch_amount: 450000, root_cause: "GSTR-1 not filed", confidence_score: 78, severity: "crit", gstin: "07AADCC0789Q1Z1" },
  { id: "3", vendor_name: "Nova Enterprises", invoice_id: "INV-2024-0731", mismatch_amount: 125000, root_cause: "ITC reversal required", confidence_score: 88, severity: "med", gstin: "29AADCN0123K1Z9" },
  { id: "4", vendor_name: "Bharat Steel Works", invoice_id: "INV-2024-0995", mismatch_amount: 320000, root_cause: "Rate mismatch 18% vs 12%", confidence_score: 65, severity: "high", gstin: "24AADCB0456P1Z3" },
  { id: "5", vendor_name: "Zenith Logistics Hub", invoice_id: "INV-2024-1240", mismatch_amount: 540000, root_cause: "GSTR-1 not filed", confidence_score: 91, severity: "crit", gstin: "33AADCL0912D1Z4" },
  { id: "6", vendor_name: "Quantum Tech Solutions", invoice_id: "INV-2024-1502", mismatch_amount: 85000, root_cause: "Rule 36(4) 5% cap exceeded", confidence_score: 97, severity: "med", gstin: "36AADCO8821M1Z8" },
];
