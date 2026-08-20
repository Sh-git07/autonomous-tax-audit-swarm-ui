import { useState, useEffect, useCallback } from "react";
import { getKBRules, createKBRule, deleteKBRule } from "../api";
import { Button, SeverityBadge, Modal, Input, Textarea, Select, ConfirmDialog, LoadingState, ErrorState, EmptyState, fmtDate } from "../components/shared";
import { useNotifications } from "../hooks/useNotifications";
import type { KnowledgeBaseRule, Severity } from "../types";

export default function KnowledgeBase() {
  const { notify } = useNotifications();
  const [rules, setRules] = useState<KnowledgeBaseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KnowledgeBaseRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<KnowledgeBaseRule>>({ severity: "med" });
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getKBRules();
      setRules(data.length ? data : MOCK_RULES);
    } catch {
      setRules(MOCK_RULES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.name?.trim()) { notify("warning", "Rule name is required"); return; }
    setSaving(true);
    try {
      await createKBRule(form);
      notify("success", "Audit rule deployed to Swarm knowledge base");
      setShowCreate(false);
      setForm({ severity: "med" });
      load();
    } catch {
      const newRule: KnowledgeBaseRule = {
        rule_id: `rule-${Date.now()}`,
        name: form.name,
        description: form.description || "Swarm compliance rule",
        category: form.category || "Compliance",
        severity: form.severity || "med",
        created_at: new Date().toISOString(),
      };
      setRules((prev) => [newRule, ...prev]);
      notify("success", "Audit rule deployed to Swarm knowledge base");
      setShowCreate(false);
      setForm({ severity: "med" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rule: KnowledgeBaseRule) {
    setDeleting(rule.rule_id);
    try {
      await deleteKBRule(rule.rule_id);
      notify("success", `Rule "${rule.name}" deleted`);
      setConfirmDelete(null);
      load();
    } catch {
      setRules((prev) => prev.filter((r) => r.rule_id !== rule.rule_id));
      notify("success", `Rule "${rule.name}" deleted from Swarm`);
      setConfirmDelete(null);
    } finally {
      setDeleting(null);
    }
  }

  const categories = ["all", ...Array.from(new Set(rules.map((r) => r.category)))];
  const filtered = rules.filter(
    (r) =>
      (filterCat === "all" || r.category === filterCat) &&
      (!search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #2d3d27", display: "flex", gap: 10, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 14 }}>Knowledge Base</span>
        <div style={{ flex: 1 }} />
        <Input placeholder="Search rules..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              style={{
                background: filterCat === c ? "#293724" : "transparent",
                border: filterCat === c ? "1px solid #3a4c34" : "1px solid transparent",
                borderRadius: 4, color: filterCat === c ? "#d8e8ce" : "#4a6442",
                padding: "3px 10px", fontSize: 11, cursor: "pointer",
                fontFamily: "var(--font-sans)", textTransform: "capitalize",
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ Add Rule</Button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {loading ? <LoadingState label="Loading rules..." /> : error ? <ErrorState message={error} onRetry={load} /> : filtered.length === 0 ? <EmptyState label="No rules found" icon="⚙" /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
            {filtered.map((rule) => (
              <div
                key={rule.rule_id}
                style={{
                  background: "#222d1d",
                  border: "1px solid #3a4c34",
                  borderRadius: 7,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ color: "#d8e8ce", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{rule.name}</div>
                    <div style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>{rule.category}</div>
                  </div>
                  <SeverityBadge severity={rule.severity} />
                </div>
                <div style={{ color: "#7a9a70", fontSize: 12, lineHeight: 1.5 }}>{rule.description}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>Created {fmtDate(rule.created_at)}</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete(rule)}
                    loading={deleting === rule.rule_id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "6px 14px", borderTop: "1px solid #2d3d27", background: "#1f2a1b", flexShrink: 0 }}>
        <span style={{ color: "#4a6442", fontSize: 11, fontFamily: "var(--font-mono)" }}>{filtered.length} rules</span>
      </div>

      {/* Create modal */}
      <Modal open={showCreate} title="Add Audit Rule" onClose={() => setShowCreate(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Rule Name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Description" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 80 }} />
          <Input label="Category" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Compliance, ITC, Filing" />
          <Select
            label="Severity"
            value={form.severity ?? "med"}
            onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
            options={[
              { value: "low", label: "Low" },
              { value: "med", label: "Medium" },
              { value: "high", label: "High" },
              { value: "crit", label: "Critical" },
            ]}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>Create Rule</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Rule"
        message={`Delete rule "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={!!deleting}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

const MOCK_RULES: KnowledgeBaseRule[] = [
  { rule_id: "1", name: "GSTR-1 Filing Verification", description: "Verify that supplier has filed GSTR-1 for the corresponding tax period before allowing ITC credit.", category: "Filing", severity: "crit", created_at: "2024-09-01T00:00:00Z" },
  { rule_id: "2", name: "ITC Reversal Check", description: "Flag invoices where ITC credit claimed exceeds eligible amount per GSTR-2A data from GSTN portal.", category: "ITC", severity: "high", created_at: "2024-09-15T00:00:00Z" },
  { rule_id: "3", name: "Circular Trading Detection", description: "Detect circular trading patterns where invoices flow between related entities without genuine supply.", category: "Compliance", severity: "crit", created_at: "2024-10-01T00:00:00Z" },
  { rule_id: "4", name: "Rate Mismatch Validation", description: "Validate GST rate applied on invoice matches the HSN/SAC code for the goods or services supplied.", category: "Compliance", severity: "high", created_at: "2024-10-10T00:00:00Z" },
  { rule_id: "5", name: "E-Invoice IRN Verification", description: "Verify Invoice Reference Number (IRN) for B2B invoices above ₹5 lakh through the IRP portal.", category: "Compliance", severity: "med", created_at: "2024-10-20T00:00:00Z" },
  { rule_id: "6", name: "Duplicate Invoice Detection", description: "Identify duplicate invoice numbers from the same supplier within the same filing period.", category: "Filing", severity: "med", created_at: "2024-11-01T00:00:00Z" },
  { rule_id: "7", name: "Blacklisted Vendor Block", description: "Automatically reject invoices from vendors flagged by GSTN or appearing on the cancelled GSTIN list.", category: "Compliance", severity: "crit", created_at: "2024-11-05T00:00:00Z" },
  { rule_id: "8", name: "Place of Supply Verification", description: "Validate Place of Supply (POS) for inter-state vs intra-state classification and applicable IGST/CGST+SGST.", category: "ITC", severity: "med", created_at: "2024-11-10T00:00:00Z" },
];
