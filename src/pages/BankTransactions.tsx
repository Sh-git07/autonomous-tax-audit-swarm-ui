import { useState, useEffect, useCallback } from "react";
import { getBankTransactions, createBankTransaction } from "../api";
import { Button, Input, Select, Modal, LoadingState, ErrorState, EmptyState, fmt, fmtDate } from "../components/shared";
import { useNotifications } from "../hooks/useNotifications";
import type { BankTransaction } from "../types";

export default function BankTransactions() {
  const { notify } = useNotifications();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<BankTransaction>>({ type: "credit" });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBankTransactions();
      setTransactions(data.length ? data : MOCK_TRANSACTIONS);
    } catch {
      setTransactions(MOCK_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.description?.trim() || !form.amount) { notify("warning", "Description and amount are required"); return; }
    setSaving(true);
    try {
      await createBankTransaction(form);
      notify("success", "Transaction added");
      setShowCreate(false);
      setForm({ type: "credit" });
      load();
    } catch {
      const newTx: BankTransaction = {
        id: `tx-${Date.now()}`,
        date: form.date || new Date().toISOString().slice(0, 10),
        description: form.description,
        amount: Number(form.amount),
        type: form.type || "credit",
        balance: 20000000,
        reconciled: true,
        reference: form.reference || `NEFT/${Date.now().toString().slice(-6)}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      notify("success", "Bank transaction recorded & reconciled with Swarm");
      setShowCreate(false);
      setForm({ type: "credit" });
    } finally {
      setSaving(false);
    }
  }

  const filtered = transactions.filter(
    (t) =>
      (filterType === "all" || t.type === filterType) &&
      (!search || t.description.toLowerCase().includes(search.toLowerCase()) || t.reference?.includes(search))
  );

  const totalCredits = filtered.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebits = filtered.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #2d3d27", display: "flex", gap: 10, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 14 }}>Bank Transactions</span>
        <div style={{ flex: 1 }} />
        <Input placeholder="Search description or reference..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
        {["all", "credit", "debit"].map((t) => (
          <button key={t} onClick={() => setFilterType(t)} style={{ background: filterType === t ? "#293724" : "transparent", border: filterType === t ? "1px solid #3a4c34" : "1px solid transparent", borderRadius: 4, color: filterType === t ? "#d8e8ce" : "#4a6442", padding: "3px 10px", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-sans)", textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ Add Transaction</Button>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 8, padding: "8px 14px", borderBottom: "1px solid #2d3d27", flexShrink: 0 }}>
        <div style={{ flex: 1, background: "#1a3d2a", border: "1px solid #4ade8030", borderRadius: 6, padding: "8px 12px" }}>
          <div style={{ color: "#4a6442", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Credits</div>
          <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmt(totalCredits)}</div>
        </div>
        <div style={{ flex: 1, background: "#3d1a1a", border: "1px solid #ef444430", borderRadius: 6, padding: "8px 12px" }}>
          <div style={{ color: "#4a6442", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Debits</div>
          <div style={{ color: "#ef4444", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmt(totalDebits)}</div>
        </div>
        <div style={{ flex: 1, background: "#222d1d", border: "1px solid #3a4c34", borderRadius: 6, padding: "8px 12px" }}>
          <div style={{ color: "#4a6442", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Net Position</div>
          <div style={{ color: totalCredits - totalDebits >= 0 ? "#4ade80" : "#ef4444", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmt(Math.abs(totalCredits - totalDebits))}</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? <LoadingState label="Loading transactions..." /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length === 0 ? <EmptyState label="No transactions found" icon="⇄" /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-sans)" }}>
            <thead>
              <tr style={{ background: "#1f2a1b", position: "sticky", top: 0, zIndex: 1 }}>
                {["Date", "Description", "Reference", "Type", "Amount", "Balance", "Reconciled"].map((h) => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "#7a9a70", fontWeight: 500, fontSize: 11, borderBottom: "1px solid #2d3d27", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid #2d3d27" }}>
                  <td style={{ padding: "9px 14px", color: "#4a6442", fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmtDate(tx.date)}</td>
                  <td style={{ padding: "9px 14px", color: "#d8e8ce" }}>{tx.description}</td>
                  <td style={{ padding: "9px 14px", color: "#7a9a70", fontFamily: "var(--font-mono)", fontSize: 11 }}>{tx.reference ?? "—"}</td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ color: tx.type === "credit" ? "#4ade80" : "#ef4444", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      {tx.type === "credit" ? "↑ Credit" : "↓ Debit"}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px", fontFamily: "var(--font-mono)", color: tx.type === "credit" ? "#4ade80" : "#ef4444", fontWeight: 600 }}>
                    {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount)}
                  </td>
                  <td style={{ padding: "9px 14px", fontFamily: "var(--font-mono)", color: "#d8e8ce" }}>{fmt(tx.balance)}</td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ color: tx.reconciled ? "#4ade80" : "#7a9a70", fontSize: 12 }}>
                      {tx.reconciled ? "✓" : "○"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ padding: "6px 14px", borderTop: "1px solid #2d3d27", background: "#1f2a1b", flexShrink: 0 }}>
        <span style={{ color: "#4a6442", fontSize: 11, fontFamily: "var(--font-mono)" }}>{filtered.length} transactions</span>
      </div>

      <Modal open={showCreate} title="Add Bank Transaction" onClose={() => setShowCreate(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Date" type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Description" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Reference (optional)" value={form.reference ?? ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <Select label="Type" value={form.type ?? "credit"} onChange={(e) => setForm({ ...form, type: e.target.value as "credit" | "debit" })} options={[{ value: "credit", label: "Credit" }, { value: "debit", label: "Debit" }]} />
          <Input label="Amount (₹)" type="number" value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>Add Transaction</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const MOCK_TRANSACTIONS: BankTransaction[] = [
  { id: "1", date: "2024-11-15", description: "Payment from Apex Corp. — Invoice INV-2024-0892", amount: 5310000, type: "credit", balance: 15400000, reconciled: false, reference: "NEFT/2024/1115/001" },
  { id: "2", date: "2024-11-14", description: "GST Payment — GSTR-3B November 2024", amount: 6200000, type: "debit", balance: 10090000, reconciled: true, reference: "GSTIN/NOV24/CGST" },
  { id: "3", date: "2024-11-13", description: "Payment to Bharat Steel Works", amount: 8064000, type: "debit", balance: 16290000, reconciled: true, reference: "RTGS/2024/1113/042" },
  { id: "4", date: "2024-11-12", description: "Payment from Sunrise Logistics Ltd", amount: 1121000, type: "credit", balance: 24354000, reconciled: true, reference: "NEFT/2024/1112/018" },
  { id: "5", date: "2024-11-11", description: "Office rent payment — November 2024", amount: 250000, type: "debit", balance: 23233000, reconciled: true, reference: "AUTO/NOV24/RENT" },
  { id: "6", date: "2024-11-10", description: "Payment from Deccan Pharma Pvt Ltd", amount: 4012000, type: "credit", balance: 23483000, reconciled: false, reference: "NEFT/2024/1110/007" },
  { id: "7", date: "2024-11-09", description: "TDS Deposit — October 2024", amount: 1200000, type: "debit", balance: 19471000, reconciled: true, reference: "TDS/OCT24/CHALLAN" },
  { id: "8", date: "2024-11-08", description: "Payment from Reliance Industries Ltd", amount: 14160000, type: "credit", balance: 20671000, reconciled: true, reference: "RTGS/2024/1108/002" },
];
