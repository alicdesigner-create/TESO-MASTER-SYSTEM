import { QuoteItemStatus } from "./types";

export const ITEM_STATUS_LABELS: Record<QuoteItemStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  in_progress: "In Progress",
  done: "Done",
  rejected: "Rejected",
};

export function itemStatusColor(status: QuoteItemStatus | string): { bg: string; text: string } {
  switch (status) {
    case "approved":    return { bg: "rgba(58,144,96,0.15)",  text: "var(--status-green)" };
    case "in_progress": return { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" };
    case "done":        return { bg: "rgba(58,144,96,0.28)",  text: "#1f6b41" };
    case "rejected":    return { bg: "rgba(201,64,64,0.12)",  text: "var(--status-red)" };
    case "pending":
    default:            return { bg: "rgba(200,178,153,0.2)", text: "var(--beige)" };
  }
}

/** Solid, high-contrast colors for interactive controls (e.g. the status <select>) — white text on a fully saturated background, unlike the soft tinted badges above. */
export function itemStatusSolidColor(status: QuoteItemStatus | string): { bg: string; text: string } {
  switch (status) {
    case "approved":    return { bg: "#3a9060", text: "#ffffff" };
    case "in_progress": return { bg: "#3b82f6", text: "#ffffff" };
    case "done":        return { bg: "#1f6b41", text: "#ffffff" };
    case "rejected":    return { bg: "#c94040", text: "#ffffff" };
    case "pending":
    default:            return { bg: "#c8b299", text: "#202120" };
  }
}
