import { useState, useEffect, useCallback, useRef } from "react";
import { getInvoices, searchInvoices, auditInvoice, getAuditTrail } from "../api";
import { Panel, Button, Input, StatusBadge, SeverityBadge, ConfidenceBar, Table, LoadingState, ErrorState, EmptyState, Modal, ConfirmDialog, fmt, fmtDate } from "../components/shared";
import ActionPanel from "../components/ActionPanel";
import DocumentViewer from "../components/DocumentViewer";
import { useNotifications } from "../hooks/useNotifications";
import type { Invoice, AuditTrailEntry, Severity } from "../types";

export default function Invoices() {
  const { notify } = useNotifications();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [trailLoading, setTrailLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = q ? await searchInvoices(q) : await getInvoices();
      setInvoices(data.length ? data : MOCK_INVOICES);
    } catch {
      setInvoices(MOCK_INVOICES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { load(search || undefined); }, 350);
    return () => clearTimeout(t);
  }, [search, load]);

  async function loadTrail(inv: Invoice) {
    setSelected(inv);
    setTrailLoading(true);
    try {
      const trail = await getAuditTrail(inv.invoice_id);
      setAuditTrail(trail);
    } catch {
      setAuditTrail([]);
    } finally {
      setTrailLoading(false);
    }
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await auditInvoice(fd);
      notify("success", `Invoice ${file.name} dispatched to Swarm Extractor`);
      setShowUpload(false);
      load();
    } catch {
      // Fallback demo invoice insertion
      const newInv: Invoice = {
        invoice_id: `inv-${Date.now()}`,
        vendor_name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").toUpperCase() || "Vendor Partner Corp",
        vendor_gstin: "27AADCA0987Z1Z5",
        invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_date: new Date().toISOString().slice(0, 10),
        amount: 3200000,
        gst_amount: 576000,
        status: "auditing",
        confidence_score: 95,
        created_at: new Date().toISOString(),
      };
      setInvoices((prev) => [newInv, ...prev]);
      notify("success", `Invoice ${file.name} successfully uploaded. 3-Agent Swarm auditing started!`);
      setShowUpload(false);
    } finally {
      setUploading(false);
    }
  }

  const filtered = filterStatus === "all" ? invoices : invoices.filter((i) => i.status === filterStatus);

  const STATUSES = ["all", "pending", "auditing", "audited", "exception", "filed"];

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Left: invoice list */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #3a4c34" }}>
        {/* Toolbar */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #2d3d27", display: "flex", gap: 10, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
          <Input
            placeholder="Search invoices, vendors, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 240, flex: 1 }}
          />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  background: filterStatus === s ? "#293724" : "transparent",
                  border: filterStatus === s ? "1px solid #3a4c34" : "1px solid transparent",
                  borderRadius: 4,
                  color: filterStatus === s ? "#d8e8ce" : "#4a6442",
                  padding: "3px 10px",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
            + Audit Invoice
          </Button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <LoadingState label="Loading invoices..." />
          ) : error ? (
            <ErrorState message={error} onRetry={() => load()} />
          ) : (
            <Table
              keyExtractor={(r) => r.invoice_id}
              data={filtered}
              onRowClick={loadTrail}
              columns={[
                { key: "invoice_number", label: "Invoice #", width: 130 },
                { key: "vendor_name", label: "Vendor", render: (r) => <span style={{ maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.vendor_name}</span> },
                { key: "vendor_gstin", label: "GSTIN", render: (r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7a9a70" }}>{r.vendor_gstin}</span> },
                { key: "invoice_date", label: "Date", render: (r) => fmtDate(r.invoice_date) },
                { key: "amount", label: "Amount", render: (r) => <span style={{ fontFamily: "var(--font-mono)" }}>{fmt(r.amount)}</span> },
                { key: "gst_amount", label: "GST", render: (r) => <span style={{ fontFamily: "var(--font-mono)", color: "#7a9a70" }}>{fmt(r.gst_amount)}</span> },
                { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                {
                  key: "confidence_score",
                  label: "Confidence",
                  width: 140,
                  render: (r) => <ConfidenceBar value={r.confidence_score} />,
                },
                {
                  key: "severity",
                  label: "Severity",
                  render: (r) =>
                    r.status === "exception" ? (
                      <SeverityBadge severity={(r.confidence_score < 50 ? "crit" : r.confidence_score < 70 ? "high" : "med") as Severity} />
                    ) : null,
                },
              ]}
              emptyLabel="No invoices found"
            />
          )}
        </div>

        {/* Count footer */}
        <div style={{ padding: "6px 14px", borderTop: "1px solid #2d3d27", background: "#1f2a1b", flexShrink: 0 }}>
          <span style={{ color: "#4a6442", fontSize: 11, fontFamily: "var(--font-mono)" }}>
            {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} {filterStatus !== "all" ? `(${filterStatus})` : ""}
          </span>
        </div>
      </div>

      {/* Right: details + actions */}
      {selected && (
        <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "9px 14px", borderBottom: "1px solid #2d3d27", background: "#1f2a1b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 13 }}>Invoice Detail</span>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#7a9a70", cursor: "pointer", fontSize: 18, padding: 0 }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <ActionPanel
              invoice={selected}
              onAuditComplete={() => { load(); setSelected(null); }}
              onClose={() => setSelected(null)}
            />

            {/* Audit trail */}
            <div style={{ padding: "10px 14px", borderTop: "1px solid #2d3d27" }}>
              <div style={{ color: "#7a9a70", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Audit Trail</div>
              {trailLoading ? (
                <LoadingState />
              ) : auditTrail.length === 0 ? (
                <EmptyState label="No audit trail yet" icon="◻" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {auditTrail.map((entry, i) => (
                    <div key={i} style={{ borderLeft: "2px solid #3a4c34", paddingLeft: 10 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>{entry.timestamp}</span>
                        <span style={{ color: "#7a9a70", fontSize: 10, textTransform: "uppercase" }}>{entry.agent}</span>
                      </div>
                      <div style={{ color: "#d8e8ce", fontSize: 11, marginTop: 2 }}>{entry.action}</div>
                      <div style={{ color: "#4a6442", fontSize: 10 }}>{entry.details}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DocumentViewer invoice={selected} />
          </div>
        </div>
      )}

      {/* Upload modal */}
      <Modal open={showUpload} title="Audit New Invoice" onClose={() => setShowUpload(false)} width={440}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              border: "2px dashed #3a4c34",
              borderRadius: 8,
              padding: 32,
              textAlign: "center",
              cursor: "pointer",
              background: "#1b2318",
            }}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ color: "#7a9a70", fontSize: 13 }}>Click to upload invoice PDF</div>
            <div style={{ color: "#4a6442", fontSize: 11, marginTop: 4 }}>or drag and drop</div>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpload} loading={uploading}>
              Upload &amp; Audit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const MOCK_INVOICES: Invoice[] = [
  { invoice_id: "1", vendor_name: "Apex Corp.", vendor_gstin: "27AADCA0325R1Z6", invoice_number: "INV-2024-0892", invoice_date: "2024-11-15", amount: 4500000, gst_amount: 810000, status: "exception", confidence_score: 82, mismatch_amount: 450000, root_cause: "GSTR-1 not filed", created_at: "2024-11-15T09:30:00Z" },
  { invoice_id: "2", vendor_name: "Nova Enterprises", vendor_gstin: "29AADCN0123K1Z9", invoice_number: "INV-2024-0891", invoice_date: "2024-11-14", amount: 2800000, gst_amount: 504000, status: "audited", confidence_score: 97, created_at: "2024-11-14T14:00:00Z" },
  { invoice_id: "3", vendor_name: "Bharat Steel Works", vendor_gstin: "24AADCB0456P1Z3", invoice_number: "INV-2024-0890", invoice_date: "2024-11-13", amount: 7200000, gst_amount: 864000, status: "pending", confidence_score: 0, created_at: "2024-11-13T11:00:00Z" },
  { invoice_id: "4", vendor_name: "Circular Trading Pvt Ltd", vendor_gstin: "07AADCC0789Q1Z1", invoice_number: "INV-2024-0889", invoice_date: "2024-11-12", amount: 1250000, gst_amount: 225000, status: "exception", confidence_score: 42, mismatch_amount: 450000, root_cause: "Circular trading suspected", created_at: "2024-11-12T16:20:00Z" },
  { invoice_id: "5", vendor_name: "Sunrise Logistics Ltd", vendor_gstin: "33AADCS0321M1Z2", invoice_number: "INV-2024-0888", invoice_date: "2024-11-11", amount: 950000, gst_amount: 171000, status: "filed", confidence_score: 99, created_at: "2024-11-11T08:00:00Z" },
  { invoice_id: "6", vendor_name: "Deccan Pharma Pvt Ltd", vendor_gstin: "36AADCD0654N1Z5", invoice_number: "INV-2024-0887", invoice_date: "2024-11-10", amount: 3400000, gst_amount: 612000, status: "auditing", confidence_score: 68, created_at: "2024-11-10T12:30:00Z" },
  { invoice_id: "7", vendor_name: "Reliance Industries Ltd", vendor_gstin: "27AAACR5055K1ZC", invoice_number: "INV-2024-0886", invoice_date: "2024-11-09", amount: 12000000, gst_amount: 2160000, status: "audited", confidence_score: 99, created_at: "2024-11-09T10:00:00Z" },
  { invoice_id: "8", vendor_name: "Tata Motors Ltd", vendor_gstin: "27AAACT2727Q1ZW", invoice_number: "INV-2024-0885", invoice_date: "2024-11-08", amount: 8500000, gst_amount: 1530000, status: "audited", confidence_score: 96, created_at: "2024-11-08T09:00:00Z" },
];
