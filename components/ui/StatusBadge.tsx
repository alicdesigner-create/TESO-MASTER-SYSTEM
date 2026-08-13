const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  // Project
  pending:     { bg: "var(--yellow-bg)",  color: "var(--yellow-text)",  label: "Pending" },
  in_progress: { bg: "var(--blue-bg)",    color: "var(--blue-text)",    label: "In Progress" },
  done:        { bg: "var(--green-bg)",   color: "var(--green-text)",   label: "Done" },
  cancelled:   { bg: "var(--neutral-bg)", color: "var(--neutral-text)", label: "Cancelled" },
  // Quote
  draft:       { bg: "var(--neutral-bg)", color: "var(--neutral-text)", label: "Draft" },
  sent:        { bg: "var(--blue-bg)",    color: "var(--blue-text)",    label: "Sent" },
  accepted:    { bg: "var(--green-bg)",   color: "var(--green-text)",   label: "Accepted" },
  rejected:    { bg: "var(--red-bg)",     color: "var(--red-text)",     label: "Rejected" },
  expired:     { bg: "var(--red-bg)",     color: "var(--red-text)",     label: "Expired" },
  declined:    { bg: "var(--red-bg)",     color: "var(--red-text)",     label: "Declined" },
  // Invoice
  paid:        { bg: "var(--green-bg)",   color: "var(--green-text)",   label: "Paid" },
  unpaid:      { bg: "var(--yellow-bg)",  color: "var(--yellow-text)",  label: "Unpaid" },
  partial:     { bg: "var(--blue-bg)",    color: "var(--blue-text)",    label: "Partial" },
  overdue:     { bg: "var(--red-bg)",     color: "var(--red-text)",     label: "Overdue" },
  // Website
  active:      { bg: "var(--green-bg)",   color: "var(--green-text)",   label: "Active" },
  paused:      { bg: "var(--yellow-bg)",  color: "var(--yellow-text)",  label: "Paused" },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? {
    bg: "var(--neutral-bg)",
    color: "var(--neutral-text)",
    label: status,
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: size === "sm" ? "2px 7px" : "3px 9px",
        borderRadius: 4,
        backgroundColor: style.bg,
        color: style.color,
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: 600,
        letterSpacing: "0.2px",
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
    </span>
  );
}
