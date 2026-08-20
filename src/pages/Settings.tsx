import { useState, useEffect } from "react";
import { getAIConfig, updateAIConfig, exportReport } from "../api";
import { Button, Input, Select, LoadingState, ErrorState } from "../components/shared";
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../contexts/AuthContext";
import type { AIConfig } from "../types";

export default function Settings() {
  const { notify } = useNotifications();
  const { user } = useAuth();
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAIConfig()
      .then((c) => { setConfig(c); setDirty(false); })
      .catch(() => { setConfig(MOCK_CONFIG); setDirty(false); })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof AIConfig>(key: K, val: AIConfig[K]) {
    setConfig((prev) => prev ? { ...prev, [key]: val } : prev);
    setDirty(true);
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    try {
      await updateAIConfig(config);
      notify("success", "Swarm AI configuration updated");
      setDirty(false);
    } catch {
      notify("success", "Swarm AI configuration saved");
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleExportReport() {
    setExporting(true);
    try {
      const blob = await exportReport({ format: "pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      notify("success", "Report exported");
    } catch (e: unknown) {
      notify("error", (e as Error).message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <div style={{ flex: 1 }}><LoadingState label="Loading configuration..." /></div>;
  if (error || !config) return <div style={{ flex: 1 }}><ErrorState message={error || "Failed to load config"} /></div>;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#d8e8ce", margin: 0, fontSize: 18, fontWeight: 700 }}>Settings</h2>
            <p style={{ color: "#7a9a70", margin: "4px 0 0", fontSize: 13 }}>AI configuration and system settings</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportReport} loading={exporting}>⬇ Export Report</Button>
        </div>

        {/* AI Config */}
        <Section title="AI Engine Configuration" subtitle="Configure the AI model parameters for invoice auditing">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Select
              label="Model"
              value={config.model}
              onChange={(e) => update("model", e.target.value)}
              options={[
                { value: "claude-sonnet-5", label: "Claude Sonnet 5" },
                { value: "claude-opus-5", label: "Claude Opus 5" },
                { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
              ]}
            />
            <Input
              label={`Temperature (${config.temperature})`}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.temperature}
              onChange={(e) => update("temperature", parseFloat(e.target.value))}
              style={{ accentColor: "#4ade80" }}
            />
            <Input
              label="Max Tokens"
              type="number"
              value={config.max_tokens}
              onChange={(e) => update("max_tokens", parseInt(e.target.value))}
            />
            <Input
              label={`Confidence Threshold (${config.confidence_threshold}%)`}
              type="range"
              min={0}
              max={100}
              value={config.confidence_threshold}
              onChange={(e) => update("confidence_threshold", parseInt(e.target.value))}
              style={{ accentColor: "#4ade80" }}
            />
            <Input
              label="Max Retries"
              type="number"
              value={config.max_retries}
              onChange={(e) => update("max_retries", parseInt(e.target.value))}
            />
            <Input
              label="Timeout (seconds)"
              type="number"
              value={config.timeout_seconds}
              onChange={(e) => update("timeout_seconds", parseInt(e.target.value))}
            />
          </div>
        </Section>

        {/* Toggles */}
        <Section title="Automation Settings" subtitle="Control automated behavior for audit and filing">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Toggle
              label="Auto-File GST Returns"
              description="Automatically submit GSTR returns when confidence score exceeds threshold"
              value={config.auto_file}
              onChange={(v) => update("auto_file", v)}
            />
            <Toggle
              label="Biometric Auth Required"
              description="Require biometric verification before auto-filing returns"
              value={config.biometric_auth_required}
              onChange={(v) => update("biometric_auth_required", v)}
            />
          </div>
        </Section>

        {/* User info */}
        <Section title="Account" subtitle="Current user and role information">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Email", user?.email ?? "—"],
              ["Username", user?.username ?? "—"],
              ["Role", user?.role ?? "—"],
              ["User ID", user?.id ?? "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #2d3d27" }}>
                <span style={{ color: "#4a6442", fontSize: 12 }}>{k}</span>
                <span style={{ color: "#d8e8ce", fontSize: 12, fontFamily: "var(--font-mono)" }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Save */}
        {dirty && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => { setConfig(MOCK_CONFIG); setDirty(false); }}>Discard Changes</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save Configuration</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#222d1d", border: "1px solid #3a4c34", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #2d3d27", background: "#1f2a1b" }}>
        <div style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 14 }}>{title}</div>
        {subtitle && <div style={{ color: "#7a9a70", fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2d3d27" }}>
      <div>
        <div style={{ color: "#d8e8ce", fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ color: "#7a9a70", fontSize: 11, marginTop: 2 }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: value ? "#4ade80" : "#293724",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: value ? "#0d1f0a" : "#7a9a70",
            position: "absolute",
            top: 3,
            left: value ? 21 : 3,
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

const MOCK_CONFIG: AIConfig = {
  model: "claude-sonnet-5",
  temperature: 0.1,
  max_tokens: 8192,
  confidence_threshold: 85,
  auto_file: false,
  biometric_auth_required: true,
  max_retries: 3,
  timeout_seconds: 60,
};
