import { AlertTriangle, XCircle } from "lucide-react";
import { Alert } from "@/lib/alerts";

interface AlertBannerProps {
  alerts: Alert[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
      {alerts.slice(0, 5).map((alert) => (
        <div
          key={alert.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 14px",
            borderRadius: 6,
            backgroundColor: alert.severity === "critical" ? "var(--red-bg)" : "var(--yellow-bg)",
            borderLeft: `3px solid ${alert.severity === "critical" ? "var(--red-text)" : "var(--yellow-text)"}`,
            fontSize: 12,
            color: alert.severity === "critical" ? "var(--red-text)" : "var(--yellow-text)",
          }}
        >
          {alert.severity === "critical" ? (
            <XCircle size={13} />
          ) : (
            <AlertTriangle size={13} />
          )}
          {alert.message}
        </div>
      ))}
    </div>
  );
}
