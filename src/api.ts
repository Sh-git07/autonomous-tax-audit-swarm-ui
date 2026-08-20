import type {
  AuthResponse,
  User,
  DashboardStats,
  Invoice,
  InvoiceDetail,
  AuditTrailEntry,
  Vendor,
  KnowledgeBaseRule,
  Ledger,
  BankTransaction,
  AIConfig,
  HealthStatus,
  Exception,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    window.dispatchEvent(new Event("auth:logout"));
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

// Health
export async function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>("/health");
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/dashboard/stats");
}

// Invoices
export async function getInvoices(params?: Record<string, string>): Promise<Invoice[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<Invoice[]>(`/invoices${qs}`);
}

export async function searchInvoices(query: string): Promise<Invoice[]> {
  return request<Invoice[]>(`/invoices/search?q=${encodeURIComponent(query)}`);
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  return request<InvoiceDetail>(`/invoices/${id}`);
}

export async function getInvoiceFile(id: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/invoices/${id}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch file");
  return res.blob();
}

export async function getAuditTrail(id: string): Promise<AuditTrailEntry[]> {
  return request<AuditTrailEntry[]>(`/invoices/${id}/audit-trail`);
}

export async function exportInvoice(id: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/invoices/${id}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export async function deleteInvoice(id: string): Promise<void> {
  return request<void>(`/invoices/${id}`, { method: "DELETE" });
}

export async function auditInvoice(payload: FormData): Promise<Invoice> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/audit-invoice`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: payload,
  });
  if (!res.ok) throw new Error("Audit failed");
  return res.json();
}

export async function reAuditInvoice(id: string): Promise<Invoice> {
  return request<Invoice>(`/invoices/${id}/re-audit`, { method: "POST" });
}

export async function overrideInvoice(
  id: string,
  data: { override_reason: string; adjusted_amount?: number }
): Promise<Invoice> {
  return request<Invoice>(`/invoices/${id}/override`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Vendors
export async function getVendors(): Promise<Vendor[]> {
  return request<Vendor[]>("/vendors");
}

export async function createVendor(data: Partial<Vendor>): Promise<Vendor> {
  return request<Vendor>("/vendors", { method: "POST", body: JSON.stringify(data) });
}

export async function getVendor(gstin: string): Promise<Vendor> {
  return request<Vendor>(`/vendors/${gstin}`);
}

export async function updateVendor(gstin: string, data: Partial<Vendor>): Promise<Vendor> {
  return request<Vendor>(`/vendors/${gstin}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function getVendorInvoices(gstin: string): Promise<Invoice[]> {
  return request<Invoice[]>(`/vendors/${gstin}/invoices`);
}

// Knowledge Base
export async function getKBRules(): Promise<KnowledgeBaseRule[]> {
  return request<KnowledgeBaseRule[]>("/knowledge-base/rules");
}

export async function createKBRule(data: Partial<KnowledgeBaseRule>): Promise<KnowledgeBaseRule> {
  return request<KnowledgeBaseRule>("/knowledge-base/rules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteKBRule(ruleId: string): Promise<void> {
  return request<void>(`/knowledge-base/rules/${ruleId}`, { method: "DELETE" });
}

// Ledgers
export async function getLedgers(): Promise<Ledger[]> {
  return request<Ledger[]>("/ledgers");
}

export async function createLedger(data: Partial<Ledger>): Promise<Ledger> {
  return request<Ledger>("/ledgers", { method: "POST", body: JSON.stringify(data) });
}

// Bank Transactions
export async function getBankTransactions(): Promise<BankTransaction[]> {
  return request<BankTransaction[]>("/bank-transactions");
}

export async function createBankTransaction(data: Partial<BankTransaction>): Promise<BankTransaction> {
  return request<BankTransaction>("/bank-transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Reports
export async function exportReport(params?: Record<string, string>): Promise<Blob> {
  const token = getToken();
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${BASE_URL}/reports/export${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Report export failed");
  return res.blob();
}

// AI Config
export async function getAIConfig(): Promise<AIConfig> {
  return request<AIConfig>("/settings/ai-config");
}

export async function updateAIConfig(data: Partial<AIConfig>): Promise<AIConfig> {
  return request<AIConfig>("/settings/ai-config", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Exceptions (derived from invoices)
export async function getExceptions(): Promise<Exception[]> {
  const invoices = await getInvoices({ status: "exception" });
  return invoices.map((inv) => ({
    id: inv.invoice_id,
    vendor_name: inv.vendor_name,
    invoice_id: inv.invoice_id,
    mismatch_amount: inv.mismatch_amount ?? 0,
    root_cause: inv.root_cause ?? "Unknown",
    confidence_score: inv.confidence_score,
    severity: inv.confidence_score < 50 ? "crit" : inv.confidence_score < 70 ? "high" : "med",
    gstin: inv.vendor_gstin,
  }));
}

// WebSocket
export function connectAuditLogs(
  onMessage: (entry: { timestamp: string; message: string; level: string; agent?: string }) => void,
  onStatusChange: (connected: boolean) => void
): () => void {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  function connect() {
    if (stopped) return;
    try {
      const token = getToken();
      const url = token
        ? `${WS_URL}/ws/audit-logs?token=${encodeURIComponent(token)}`
        : `${WS_URL}/ws/audit-logs`;
      ws = new WebSocket(url);

      ws.onopen = () => onStatusChange(true);
      ws.onclose = () => {
        onStatusChange(false);
        if (!stopped) reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => {
        onStatusChange(false);
        ws?.close();
      };
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          onMessage(data);
        } catch {
          onMessage({ timestamp: new Date().toISOString(), message: evt.data, level: "info" });
        }
      };
    } catch {
      onStatusChange(false);
      if (!stopped) reconnectTimer = setTimeout(connect, 3000);
    }
  }

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}

export const wsUrl = WS_URL;
