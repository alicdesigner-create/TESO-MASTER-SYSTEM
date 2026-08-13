"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import QuotePDF from "./QuotePDF";
import { Quote, Client } from "@/lib/types";
import { FileDown } from "lucide-react";

interface Props {
  quote: Quote;
  client: Client | null;
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "7px 14px",
  backgroundColor: "var(--bg-card)",
  color: "var(--beige)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 13,
  textDecoration: "none",
};

export default function QuoteDownloadButton({ quote, client }: Props) {
  return (
    <PDFDownloadLink
      document={<QuotePDF quote={quote} client={client} />}
      fileName={`Quote-${quote.quoteNumber}-${client?.businessName?.replace(/\s+/g, "-") ?? "client"}.pdf`}
      style={{ textDecoration: "none" }}
    >
      {(({ loading }: { loading: boolean }) => (
        <span style={{ ...btnStyle, color: loading ? "var(--text-muted)" : "var(--beige)" }}>
          <FileDown size={13} />
          {loading ? "Preparing PDF..." : "Download PDF"}
        </span>
      )) as unknown as React.ReactNode}
    </PDFDownloadLink>
  );
}
