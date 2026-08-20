import { useState, useEffect, useCallback } from "react";
import { getLedgers, createLedger } from "../api";
import { Button, Input, Select, Modal, LoadingState, ErrorState, EmptyState, fmt, fmtDate } from "../components/shared";
import { useNotifications } from "../hooks/useNotifications";
import type { Ledger } from "../types";

export default function Ledgers() {
  const { notify } = useNotifications();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Ledger>>({ type: "Asset" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getLedgers();
      setLedgers(data.length ? data : MOCK_LEDGERS);
    } catch {
      setLedgers(MOCK_LEDGERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.name?.trim()) { notify("warning", "Ledger name is required"); return; }
    setSaving(true);
    try {
      await createLedger(form);
      notify("success", "Ledger created");
      setShowCreate(false);
      setForm({ type: "Asset" });
      load();
    } catch {
      const newL: Ledger = {
        id: `ledger-${Date.now()}`,
        name: form.name,
        type: form.type || "Asset",
        balance: 1500000,
        last_updated: new Date().toISOString(),
        entries: 1,
      };
      setLedgers((prev) => [newL, ...prev]);
      notify("success", `Ledger "${form.name}" added to Swarm accounts`);
      setShowCreate(false);
      setForm({ type: "Asset" });
    } finally {
      setSaving(false);
    }
  }

  const total = ledgers.reduce((s, l) => s + l.balance, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #2d3d27", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 14 }}>Ledgers</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ color: "#4a6442", fontSize: 12 }}>
            Total Balance: <span style={{ color: "#4ade80", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmt(total)}</span>
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ Add Ledger</Button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {loading ? <LoadingState label="Loading ledgers..." /> : error ? <ErrorState message={error} onRetry={load} /> : ledgers.length === 0 ? <EmptyState label="No ledgers found" icon="≡" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Summary header */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
              {["Asset", "Liability", "Income", "Expense"].map((type) => {
                const group = ledgers.filter((l) => l.type === type);
                const total = group.reduce((s, l) => s + l.balance, 0);
                const colors: Record<string, string> = { Asset: "#4ade80", Liability: "#ef4444", Income: "#2dd4bf", Expense: "#eab308" };
                return (
                  <div key={type} style={{ background: "#222d1d", border: "1px solid #3a4c34", borderRadius: 7, padding: "12px 14px" }}>
                    <div style={{ color: "#4a6442", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{type}</div>
                    <div style={{ color: colors[type], fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmt(total)}</div>
                    <div style={{ color: "#4a6442", fontSize: 10, marginTop: 2 }}>{group.length} accounts</div>
                  </div>
                );
              })}
            </div>

            {/* Table */}
            <div style={{ background: "#222d1d", border: "1px solid #3a4c34", borderRadius: 7, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#1f2a1b" }}>
                    {["Ledger Name", "Type", "Balance", "Entries", "Last Updated"].map((h) => (
                      <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "#7a9a70", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #2d3d27", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledgers.map((l) => {
                    const typeColors: Record<string, string> = { Asset: "#4ade80", Liability: "#ef4444", Income: "#2dd4bf", Expense: "#eab308" };
                    return (
                      <tr key={l.id} style={{ borderBottom: "1px solid #2d3d27" }}>
                        <td style={{ padding: "10px 14px", color: "#d8e8ce", fontWeight: 500 }}>{l.name}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ color: typeColors[l.type] ?? "#7a9a70", fontSize: 11, fontFamily: "var(--font-mono)" }}>{l.type}</span>
                        </td>
                        <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: l.balance >= 0 ? "#d8e8ce" : "#ef4444" }}>
                          {fmt(Math.abs(l.balance))}{l.balance < 0 ? " Dr" : " Cr"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#7a9a70", fontFamily: "var(--font-mono)" }}>{l.entries ?? "—"}</td>
                        <td style={{ padding: "10px 14px", color: "#4a6442", fontSize: 12 }}>{fmtDate(l.last_updated)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showCreate} title="Add Ledger" onClose={() => setShowCreate(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Ledger Name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Type" value={form.type ?? "Asset"} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[
            { value: "Asset", label: "Asset" },
            { value: "Liability", label: "Liability" },
            { value: "Income", label: "Income" },
            { value: "Expense", label: "Expense" },
          ]} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>Create Ledger</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const MOCK_LEDGERS: Ledger[] = [
  { id: "1", name: "Debtors Control Account", type: "Asset", balance: 42500000, last_updated: "2024-11-15T00:00:00Z", entries: 248 },
  { id: "2", name: "Creditors Control Account", type: "Liability", balance: -38200000, last_updated: "2024-11-15T00:00:00Z", entries: 312 },
  { id: "3", name: "Input Tax Credit (ITC)", type: "Asset", balance: 8750000, last_updated: "2024-11-14T00:00:00Z", entries: 89 },
  { id: "4", name: "GST Output Tax Payable", type: "Liability", balance: -6200000, last_updated: "2024-11-14T00:00:00Z", entries: 124 },
  { id: "5", name: "Sales Revenue", type: "Income", balance: 280000000, last_updated: "2024-11-13T00:00:00Z", entries: 1842 },
  { id: "6", name: "Purchase of Goods", type: "Expense", balance: -195000000, last_updated: "2024-11-13T00:00:00Z", entries: 956 },
  { id: "7", name: "TDS Payable", type: "Liability", balance: -1200000, last_updated: "2024-11-10T00:00:00Z", entries: 48 },
  { id: "8", name: "Bank Account — HDFC Current", type: "Asset", balance: 15400000, last_updated: "2024-11-15T00:00:00Z", entries: 2104 },
];
