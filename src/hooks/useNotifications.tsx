import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ReactElement } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface NotifContextValue {
  notifications: Notification[];
  notify: (type: Notification["type"], message: string) => void;
  dismiss: (id: string) => void;
}

const NotifContext = createContext<NotifContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }): ReactElement {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((type: Notification["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotifContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
      <NotificationContainer />
    </NotifContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, dismiss } = useNotifications();
  if (!notifications.length) return null;

  const colors: Record<Notification["type"], string> = {
    success: "#4ade80",
    error: "#ef4444",
    warning: "#eab308",
    info: "#60a5fa",
  };

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {notifications.map((n) => (
        <div
          key={n.id}
          className="animate-slide-in"
          style={{
            background: "#222d1d",
            border: `1px solid ${colors[n.type]}40`,
            borderLeft: `3px solid ${colors[n.type]}`,
            borderRadius: 6,
            padding: "10px 14px",
            minWidth: 280,
            maxWidth: 380,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <span style={{ color: colors[n.type], fontSize: 14 }}>
            {n.type === "success" ? "✓" : n.type === "error" ? "✕" : n.type === "warning" ? "⚠" : "ℹ"}
          </span>
          <span style={{ color: "#d8e8ce", fontSize: 13, flex: 1 }}>{n.message}</span>
          <button
            onClick={() => dismiss(n.id)}
            style={{ color: "#7a9a70", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function useNotifications(): NotifContextValue {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
}
