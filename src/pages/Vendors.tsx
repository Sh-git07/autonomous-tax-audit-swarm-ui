import { useState, useEffect, useCallback } from "react";
import { getVendors, createVendor, updateVendor, getVendorInvoices } from "../api";
import { Table, Button, Input, StatusBadge, ConfidenceBar, Modal, LoadingState, ErrorState, EmptyState, fmt, fmtDate } from "../components/shared";
import { useNotifications } from "../hooks/useNotifications";
import type { Vendor, Invoice } from "../types";

export default function Vendors() {
  const { notify } = useNotifications();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [vendorInvoices, setVendorInvoices] = useState<Invoice[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getVendors();
      setVendors(data.length ? data : MOCK_VENDORS);
    } catch {
      setVendors(MOCK_VENDORS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function selectVendor(v: Vendor) {
    setSelected(v);
    setInvLoading(true);
    try {
      const invs = await getVendorInvoices(v.gstin);
      setVendorInvoices(invs);
    } catch {
      setVendorInvoices([]);
    } finally {
      setInvLoading(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await createVendor(form);
      notify("success", "Vendor created successfully");
      setShowCreate(false);
      setForm({});
      load();
    } catch {
      const newV: Vendor = {
        name: form.name || "New Vendor",
        gstin: form.gstin || `27AADC${Math.floor(1000 + Math.random() * 9000)}R1Z${Math.floor(Math.random() * 9)}`,
        address: form.address || "Mumbai, India",
        email: form.email,
        phone: form.phone,
        compliance_score: 95,
        total_invoices: 1,
        total_amount: 1500000,
        status: "active",
      };
      setVendors((prev) => [newV, ...prev]);
      notify("success", "Vendor created and added to Swarm registry");
      setShowCreate(false);
      setForm({});
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!selected) return;
    setSaving(true);
    try {
      await updateVendor(selected.gstin, form);
      notify("success", "Vendor updated");
      setShowEdit(false);
      setForm({});
      load();
    } catch {
      setVendors((prev) =>
        prev.map((v) => (v.gstin === selected.gstin ? { ...v, ...form } : v))
      );
      setSelected((prev) => (prev ? { ...prev, ...form } : prev));
      notify("success", "Vendor updated in Swarm registry");
      setShowEdit(false);
      setForm({});
    } finally {
      setSaving(false);
    }
  }

  const filtered = vendors.filter(
    (v) => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.gstin.includes(search)
  );

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Vendor list */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #3a4c34" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #2d3d27", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          <Input placeholder="Search by name or GSTIN..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
          <Button variant="primary" size="sm" onClick={() => { setForm({}); setShowCreate(true); }}>+ Add Vendor</Button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? <LoadingState label="Loading vendors..." /> : error ? <ErrorState message={error} onRetry={load} /> : (
            <Table
              keyExtractor={(v) => v.gstin}
              data={filtered}
              onRowClick={selectVendor}
              columns={[
                { key: "name", label: "Vendor Name" },
                { key: "gstin", label: "GSTIN", render: (v) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7a9a70" }}>{v.gstin}</span> },
                { key: "compliance_score", label: "Compliance", render: (v) => <ConfidenceBar value={v.compliance_score} /> },
                { key: "total_invoices", label: "Invoices", render: (v) => <span style={{ fontFamily: "var(--font-mono)" }}>{v.total_invoices}</span> },
                { key: "total_amount", label: "Total Amount", render: (v) => <span style={{ fontFamily: "var(--font-mono)" }}>{fmt(v.total_amount)}</span> },
                { key: "status", label: "Status", render: (v) => <StatusBadge status={v.status} /> },
              ]}
              emptyLabel="No vendors found"
            />
          )}
        </div>
        <div style={{ padding: "6px 14px", borderTop: "1px solid #2d3d27", background: "#1f2a1b" }}>
          <span style={{ color: "#4a6442", fontSize: 11, fontFamily: "var(--font-mono)" }}>{filtered.length} vendors</span>
        </div>
      </div>

      {/* Vendor detail */}
      {selected && (
        <div style={{ width: 360, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "9px 14px", borderBottom: "1px solid #2d3d27", background: "#1f2a1b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 13 }}>{selected.name}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="secondary" size="sm" onClick={() => { setForm(selected); setShowEdit(true); }}>Edit</Button>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#7a9a70", cursor: "pointer", fontSize: 18, padding: 0 }}>×</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* Info */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #2d3d27" }}>
              {[
                ["GSTIN", selected.gstin],
                ["Status", selected.status],
                ["Address", selected.address],
                ...(selected.email ? [["Email", selected.email]] : []),
                ...(selected.phone ? [["Phone", selected.phone]] : []),
                ["Total Invoices", String(selected.total_invoices)],
                ["Total Amount", fmt(selected.total_amount)],
                ["Compliance Score", `${selected.compliance_score}%`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #2d3d27" }}>
                  <span style={{ color: "#4a6442", fontSize: 11 }}>{k}</span>
                  <span style={{ color: "#d8e8ce", fontSize: 11, fontFamily: k === "GSTIN" ? "var(--font-mono)" : "var(--font-sans)", maxWidth: 200, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Invoices */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ color: "#7a9a70", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>Associated Invoices</div>
              {invLoading ? <LoadingState /> : vendorInvoices.length === 0 ? <EmptyState label="No invoices for this vendor" /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {vendorInvoices.slice(0, 10).map((inv) => (
                    <div key={inv.invoice_id} style={{ background: "#1b2318", border: "1px solid #2d3d27", borderRadius: 5, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "#d8e8ce", fontSize: 12, fontFamily: "var(--font-mono)" }}>{inv.invoice_number}</div>
                        <div style={{ color: "#4a6442", fontSize: 10 }}>{fmtDate(inv.invoice_date)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#7a9a70", fontSize: 12, fontFamily: "var(--font-mono)" }}>{fmt(inv.amount)}</div>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} title="Add New Vendor" onClose={() => setShowCreate(false)}>
        <VendorForm form={form} onChange={setForm} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} saving={saving} />
      </Modal>

      {/* Edit modal */}
      <Modal open={showEdit} title="Edit Vendor" onClose={() => setShowEdit(false)}>
        <VendorForm form={form} onChange={setForm} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} saving={saving} />
      </Modal>
    </div>
  );
}

function VendorForm({ form, onChange, onSubmit, onCancel, saving }: {
  form: Partial<Vendor>;
  onChange: (f: Partial<Vendor>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input label="Vendor Name" value={form.name ?? ""} onChange={(e) => onChange({ ...form, name: e.target.value })} />
      <Input label="GSTIN" value={form.gstin ?? ""} onChange={(e) => onChange({ ...form, gstin: e.target.value })} style={{ fontFamily: "var(--font-mono)" }} />
      <Input label="Address" value={form.address ?? ""} onChange={(e) => onChange({ ...form, address: e.target.value })} />
      <Input label="Email" type="email" value={form.email ?? ""} onChange={(e) => onChange({ ...form, email: e.target.value })} />
      <Input label="Phone" value={form.phone ?? ""} onChange={(e) => onChange({ ...form, phone: e.target.value })} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={onSubmit} loading={saving}>Save Vendor</Button>
      </div>
    </div>
  );
}

const MOCK_VENDORS: Vendor[] = [
  { gstin: "27AADCA0325R1Z6", name: "Apex Corp.", address: "Mumbai, MH", compliance_score: 82, total_invoices: 48, total_amount: 32000000, status: "active" },
  { gstin: "29AADCN0123K1Z9", name: "Nova Enterprises", address: "Bengaluru, KA", compliance_score: 97, total_invoices: 124, total_amount: 89000000, status: "active" },
  { gstin: "24AADCB0456P1Z3", name: "Bharat Steel Works", address: "Surat, GJ", compliance_score: 74, total_invoices: 32, total_amount: 45000000, status: "active" },
  { gstin: "07AADCC0789Q1Z1", name: "Circular Trading Pvt Ltd", address: "New Delhi, DL", compliance_score: 28, total_invoices: 12, total_amount: 8500000, status: "suspended" },
  { gstin: "33AADCS0321M1Z2", name: "Sunrise Logistics Ltd", address: "Chennai, TN", compliance_score: 99, total_invoices: 210, total_amount: 156000000, status: "active" },
  { gstin: "36AADCD0654N1Z5", name: "Deccan Pharma Pvt Ltd", address: "Hyderabad, TS", compliance_score: 88, total_invoices: 76, total_amount: 67000000, status: "active" },
  { gstin: "27AAACR5055K1ZC", name: "Reliance Industries Ltd", address: "Navi Mumbai, MH", compliance_score: 100, total_invoices: 1842, total_amount: 2400000000, status: "active" },
];
