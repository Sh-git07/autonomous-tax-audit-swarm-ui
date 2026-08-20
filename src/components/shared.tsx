import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import type { Severity } from "../types";

// ── Button ──────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "teal";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: "sm" | "md";
  loading?: boolean;
  children: ReactNode;
}

const btnStyles: Record<BtnVariant, string> = {
  primary:
    "bg-[#3a5c38] border border-[#4ade80] text-[#d8e8ce] hover:bg-[#4a7048] active:bg-[#3a5c38]",
  secondary:
    "bg-[#293724] border border-[#3a4c34] text-[#d8e8ce] hover:bg-[#324228] active:bg-[#293724]",
  ghost: "bg-transparent border border-transparent text-[#7a9a70] hover:text-[#d8e8ce] hover:bg-[#293724]",
  danger: "bg-[#3d1d1d] border border-[#ef4444] text-[#f8a0a0] hover:bg-[#4d2424]",
  teal: "bg-[#1a3d38] border border-[#2dd4bf] text-[#d8e8ce] hover:bg-[#224a44]",
};

export function Button({ variant = "secondary", size = "md", loading, children, disabled, ...rest }: ButtonProps) {
  const sz = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{ fontFamily: "var(--font-sans)", cursor: disabled || loading ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, borderRadius: 5, transition: "background 0.15s", ...rest.style }}
      className={`${sz} ${btnStyles[variant]} font-medium inline-flex items-center gap-1.5 select-none ${rest.className ?? ""}`}
    >
      {loading ? <Spinner size={12} /> : null}
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, ...rest }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ color: "#7a9a70", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
      <input
        {...rest}
        style={{
          background: "#1b2318",
          border: "1px solid #3a4c34",
          borderRadius: 5,
          color: "#d8e8ce",
          padding: "6px 10px",
          fontSize: 13,
          fontFamily: "var(--font-sans)",
          outline: "none",
          width: "100%",
          ...rest.style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#4ade80";
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#3a4c34";
          rest.onBlur?.(e);
        }}
      />
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────────────────
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, ...rest }: TextAreaProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ color: "#7a9a70", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
      <textarea
        {...rest}
        style={{
          background: "#1b2318",
          border: "1px solid #3a4c34",
          borderRadius: 5,
          color: "#d8e8ce",
          padding: "6px 10px",
          fontSize: 13,
          fontFamily: "var(--font-sans)",
          outline: "none",
          width: "100%",
          resize: "vertical",
          ...rest.style,
        }}
      />
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, ...rest }: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ color: "#7a9a70", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
      <select
        {...rest}
        style={{
          background: "#1b2318",
          border: "1px solid #3a4c34",
          borderRadius: 5,
          color: "#d8e8ce",
          padding: "6px 10px",
          fontSize: 13,
          fontFamily: "var(--font-sans)",
          outline: "none",
          width: "100%",
          ...rest.style,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#222d1d" }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Badge / Severity ─────────────────────────────────────────────────
const severityColors: Record<Severity, { bg: string; text: string; border: string }> = {
  crit: { bg: "#3d1a1a", text: "#ef4444", border: "#ef444440" },
  high: { bg: "#3d2a1a", text: "#f97316", border: "#f9731640" },
  med: { bg: "#3d361a", text: "#eab308", border: "#eab30840" },
  low: { bg: "#1a3d2a", text: "#4ade80", border: "#4ade8040" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const c = severityColors[severity];
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        padding: "1px 7px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontFamily: "var(--font-mono)",
      }}
    >
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    pending: { color: "#eab308", bg: "#3d361a" },
    auditing: { color: "#60a5fa", bg: "#1a2a3d" },
    audited: { color: "#4ade80", bg: "#1a3d2a" },
    exception: { color: "#ef4444", bg: "#3d1a1a" },
    filed: { color: "#a78bfa", bg: "#2a1a3d" },
    active: { color: "#4ade80", bg: "#1a3d2a" },
    suspended: { color: "#eab308", bg: "#3d361a" },
    blacklisted: { color: "#ef4444", bg: "#3d1a1a" },
    healthy: { color: "#4ade80", bg: "#1a3d2a" },
    degraded: { color: "#eab308", bg: "#3d361a" },
    down: { color: "#ef4444", bg: "#3d1a1a" },
  };
  const c = map[status] ?? { color: "#7a9a70", bg: "#293724" };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        borderRadius: 4,
        padding: "1px 8px",
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "var(--font-mono)",
      }}
    >
      {status}
    </span>
  );
}

// ── Card ─────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  actions?: ReactNode;
}

export function Card({ children, title, actions, style }: CardProps) {
  return (
    <div
      style={{
        background: "#222d1d",
        border: "1px solid #3a4c34",
        borderRadius: 7,
        overflow: "hidden",
        ...style,
      }}
    >
      {(title || actions) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid #2d3d27",
            background: "#1f2a1b",
          }}
        >
          {title && (
            <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 13 }}>{title}</span>
          )}
          {actions && <div style={{ display: "flex", gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

// ── Panel (flat card without padding) ───────────────────────────────
export function Panel({
  children,
  title,
  actions,
  style,
  bodyStyle,
}: CardProps & { bodyStyle?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "#222d1d",
        border: "1px solid #3a4c34",
        borderRadius: 7,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {(title || actions) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 14px",
            borderBottom: "1px solid #2d3d27",
            background: "#1f2a1b",
            flexShrink: 0,
          }}
        >
          {title && <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 13 }}>{title}</span>}
          {actions && <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{actions}</div>}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, ...bodyStyle }}>{children}</div>
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = "#4ade80" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      className="animate-spin"
      style={{ flexShrink: 0 }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Loading State ────────────────────────────────────────────────────
export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
      <Spinner size={28} />
      <span style={{ color: "#7a9a70", fontSize: 13 }}>{label}</span>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────
export function EmptyState({ label = "No data", icon = "◻" }: { label?: string; icon?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 40 }}>
      <span style={{ fontSize: 32, opacity: 0.3 }}>{icon}</span>
      <span style={{ color: "#4a6442", fontSize: 13 }}>{label}</span>
    </div>
  );
}

// ── Error State ──────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 40 }}>
      <span style={{ fontSize: 24 }}>⚠</span>
      <span style={{ color: "#ef4444", fontSize: 13, textAlign: "center", maxWidth: 280 }}>{message}</span>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

// ── Confirmation Dialog ──────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  danger,
  loading,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        className="animate-slide-in"
        style={{
          background: "#222d1d",
          border: "1px solid #3a4c34",
          borderRadius: 8,
          padding: 24,
          maxWidth: 400,
          width: "90%",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 8px", color: "#d8e8ce", fontSize: 15, fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: "0 0 20px", color: "#7a9a70", fontSize: 13, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ open, title, onClose, children, width = 500 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        className="animate-slide-in"
        style={{ background: "#222d1d", border: "1px solid #3a4c34", borderRadius: 8, maxWidth: width, width: "90%", maxHeight: "85vh", overflow: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #2d3d27", background: "#1f2a1b" }}>
          <span style={{ color: "#d8e8ce", fontWeight: 600, fontSize: 14 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7a9a70", cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Confidence Bar ───────────────────────────────────────────────────
export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? "#4ade80" : value >= 65 ? "#eab308" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "#293724", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      <span style={{ color, fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", minWidth: 32 }}>{value}%</span>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────
interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  width?: number | string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyLabel?: string;
  keyExtractor: (row: T) => string;
}

export function Table<T>({ columns, data, onRowClick, loading, emptyLabel, keyExtractor }: TableProps<T>) {
  if (loading) return <LoadingState />;
  if (!data.length) return <EmptyState label={emptyLabel ?? "No records found"} />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#1f2a1b" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ padding: "8px 12px", textAlign: "left", color: "#7a9a70", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", width: col.width, borderBottom: "1px solid #2d3d27", whiteSpace: "nowrap" }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              style={{ borderBottom: "1px solid #2d3d27", cursor: onRowClick ? "pointer" : "default", transition: "background 0.1s" }}
              onMouseEnter={(e) => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = "#293724"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "9px 12px", color: "#d8e8ce", verticalAlign: "middle" }}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Stats Card ────────────────────────────────────────────────────────
export function StatsCard({
  label,
  value,
  sub,
  color = "#4ade80",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: string;
}) {
  return (
    <div
      style={{
        background: "#222d1d",
        border: "1px solid #3a4c34",
        borderRadius: 7,
        padding: "14px 16px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#7a9a70", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        {icon && <span style={{ fontSize: 16, opacity: 0.6 }}>{icon}</span>}
      </div>
      <div style={{ color, fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: "#4a6442", fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────
export function fmt(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
