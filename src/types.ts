export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "auditor" | "viewer";
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DashboardStats {
  total_invoices: number;
  audited_invoices: number;
  pending_invoices: number;
  exceptions_count: number;
  total_liability: number;
  adjusted_liability: number;
  confidence_avg: number;
  processing_speed: number;
  token_usage: number;
}

export type InvoiceStatus = "pending" | "auditing" | "audited" | "exception" | "filed";
export type Severity = "crit" | "high" | "med" | "low";
export type AgentName = "extractor" | "reconciler" | "filer";

export interface Invoice {
  invoice_id: string;
  vendor_name: string;
  vendor_gstin: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  gst_amount: number;
  status: InvoiceStatus;
  confidence_score: number;
  mismatch_amount?: number;
  root_cause?: string;
  created_at: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  gst_rate: number;
  gst_amount: number;
}

export interface AgentStateDetail {
  agent: AgentName;
  status: "active" | "idle" | "error";
  processing_speed: number;
  token_usage: number;
  state: string;
}

export interface AuditSummary {
  original_liability: number;
  adjusted_liability: number;
  narrative: string;
  agent_states: AgentStateDetail[];
}

export interface InvoiceDetail extends Invoice {
  line_items: LineItem[];
  audit_summary?: AuditSummary;
}

export interface AuditTrailEntry {
  timestamp: string;
  action: string;
  agent: string;
  details: string;
  confidence: number;
}

export interface Exception {
  id: string;
  vendor_name: string;
  invoice_id: string;
  mismatch_amount: number;
  root_cause: string;
  confidence_score: number;
  severity: Severity;
  gstin?: string;
}

export interface Vendor {
  gstin: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
  compliance_score: number;
  total_invoices: number;
  total_amount: number;
  status: "active" | "suspended" | "blacklisted";
  created_at?: string;
}

export interface KnowledgeBaseRule {
  rule_id: string;
  name: string;
  description: string;
  category: string;
  severity: Severity;
  created_at: string;
}

export interface Ledger {
  id: string;
  name: string;
  type: string;
  balance: number;
  last_updated: string;
  entries?: number;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  balance: number;
  reconciled: boolean;
  reference?: string;
}

export interface AIConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  confidence_threshold: number;
  auto_file: boolean;
  biometric_auth_required: boolean;
  max_retries: number;
  timeout_seconds: number;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "down";
  version?: string;
  uptime?: number;
  components?: Record<string, string>;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  level: "info" | "warn" | "error";
  agent?: string;
}

export type NavPage =
  | "dashboard"
  | "invoices"
  | "vendors"
  | "knowledge-base"
  | "ledgers"
  | "bank-transactions"
  | "reports"
  | "settings";
