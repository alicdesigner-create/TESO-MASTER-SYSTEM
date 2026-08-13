import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Invoice, Client } from "@/lib/types";
import { formatLocalDate } from "@/lib/date";

const C = {
  carbon: "#202120",
  beige: "#c8b299",
  textPrimary: "#f0ece6",
  textDark: "#222222",
  textMuted: "#777777",
  border: "#e0dbd5",
  white: "#ffffff",
  red: "#c94040",
  green: "#3a9060",
};

const s = StyleSheet.create({
  page: { backgroundColor: C.white, paddingHorizontal: 48, paddingTop: 32, paddingBottom: 48, fontFamily: "Helvetica", fontSize: 9, color: C.textDark },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  logoName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.carbon, letterSpacing: 2 },
  logoSub: { fontSize: 7.5, color: C.textMuted, letterSpacing: 1, marginTop: 3 },
  logoContact: { fontSize: 7.5, color: C.textMuted, marginTop: 8, lineHeight: 1.8 },
  docLabel: { fontSize: 38, fontFamily: "Helvetica-Bold", color: C.carbon, letterSpacing: 3, textAlign: "right" },

  divider: { borderBottom: 1.5, borderColor: C.border, marginVertical: 10 },

  // Invoice meta
  metaBlock: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  billTo: { flexDirection: "column" },
  billToTag: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.beige, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  billToName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.carbon },
  billToDetail: { fontSize: 8, color: C.textMuted, marginTop: 3 },

  // Invoice number / dates / status — larger + bolder
  invDetails: { alignItems: "flex-end" },
  invKv: { flexDirection: "row", marginBottom: 5 },
  invKvLabel: { fontSize: 8, color: C.textMuted, width: 90, textAlign: "right", marginRight: 10 },
  invKvValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.carbon, width: 96 },
  invKvValueLarge: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.carbon, width: 96 },
  invKvDue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.carbon, width: 96 },
  statusUnpaid: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.red, width: 96 },
  statusPaid: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.green, width: 96 },
  statusOverdue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.red, width: 96 },
  statusPartial: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#c07a20", width: 96 },

  // Table
  tableHeader: { flexDirection: "row", backgroundColor: C.beige, paddingVertical: 7, paddingHorizontal: 10 },
  tableHeaderText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.carbon, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10, borderBottom: 1, borderColor: "#f0ede8" },
  tableRowAlt: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10, borderBottom: 1, borderColor: "#f0ede8", backgroundColor: "#faf8f5" },
  colDesc: { width: "68%" },
  colQty: { width: "14%", textAlign: "center" },
  colAmt: { width: "18%", textAlign: "right" },
  cellText: { fontSize: 8.5, color: C.textDark },
  cellMuted: { fontSize: 8.5, color: C.textMuted, textAlign: "center" },
  cellMono: { fontSize: 8.5, color: C.textDark, fontFamily: "Courier" },

  // Totals
  totalsSection: { alignItems: "flex-end", marginTop: 8, marginBottom: 14 },
  totalRow: { flexDirection: "row", width: 240, justifyContent: "space-between", paddingVertical: 4, borderBottom: 1, borderColor: "#eeeeee" },
  totalLabel: { fontSize: 8.5, color: C.textMuted },
  totalValue: { fontSize: 8.5, color: C.textDark, fontFamily: "Courier" },
  depositValue: { fontSize: 8.5, color: C.green, fontFamily: "Courier-Bold" },
  grandTotalBox: { flexDirection: "row", width: 240, justifyContent: "space-between", paddingVertical: 11, paddingHorizontal: 12, backgroundColor: C.carbon, marginTop: 6 },
  grandLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.textPrimary, letterSpacing: 0.5 },
  grandValue: { fontSize: 12, fontFamily: "Courier-Bold", color: C.beige },

  // Payment info
  paySection: { marginBottom: 10 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.carbon, textTransform: "uppercase", letterSpacing: 1, marginBottom: 9, paddingBottom: 5, borderBottom: 1, borderColor: C.border },
  payRow: { flexDirection: "row", marginBottom: 5 },
  payLabel: { fontSize: 8, color: C.textMuted, width: 160 },
  payValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.textDark },
  notesText: { fontSize: 8, color: "#555555", lineHeight: 1.8 },

  // Single signature block
  sigSection: { flexDirection: "row", marginTop: 14 },
  sigBlock: { width: "55%" },
  sigLabel: { fontSize: 7, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 },
  sigLine: { borderBottom: 1, borderColor: "#bbbbbb", marginBottom: 6 },
  sigCursive: { fontSize: 10, color: C.textDark, fontFamily: "Helvetica-Oblique" },

  // Footer
  footer: { position: "absolute", bottom: 22, left: 48, right: 48, borderTop: 1, borderColor: C.border, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: C.textMuted },
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function fmtDate(iso: string) {
  return formatLocalDate(iso, { year: "numeric", month: "long", day: "numeric" });
}

const STATUS_LABELS: Record<Invoice["status"], string> = {
  unpaid: "UNPAID",
  paid: "PAID",
  overdue: "OVERDUE",
  partial: "PARTIAL PAYMENT",
};
function statusStyle(status: Invoice["status"]) {
  if (status === "paid") return s.statusPaid;
  if (status === "overdue") return s.statusOverdue;
  if (status === "partial") return s.statusPartial;
  return s.statusUnpaid;
}

interface Props {
  invoice: Invoice;
  client: Client | null;
}

export default function InvoicePDF({ invoice, client }: Props) {
  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.logoName}>TESO GRAPHICS</Text>
            <Text style={s.logoSub}>DIGITAL PRODUCT & BRAND DESIGN</Text>
            <Text style={s.logoContact}>
              studio@tesographics.com{"  "}|{"  "}(303) 525-3023{"\n"}tesographics.com{"  "}|{"  "}Denver, CO
            </Text>
          </View>
          <Text style={s.docLabel}>INVOICE</Text>
        </View>

        <View style={s.divider} />

        {/* BILL TO + INVOICE DETAILS */}
        <View style={s.metaBlock}>
          <View style={s.billTo}>
            <Text style={s.billToTag}>Bill To</Text>
            <Text style={s.billToName}>{client?.businessName ?? "—"}</Text>
            <Text style={s.billToDetail}>{client?.contactName ?? ""}</Text>
            {client?.email ? <Text style={s.billToDetail}>{client.email}</Text> : null}
            {client?.phone ? <Text style={s.billToDetail}>{client.phone}</Text> : null}
          </View>

          <View style={s.invDetails}>
            <View style={s.invKv}>
              <Text style={s.invKvLabel}>Invoice #</Text>
              <Text style={s.invKvValueLarge}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={s.invKv}>
              <Text style={s.invKvLabel}>Invoice Date</Text>
              <Text style={s.invKvValue}>{fmtDate(invoice.date)}</Text>
            </View>
            <View style={s.invKv}>
              <Text style={s.invKvLabel}>Due Date</Text>
              <Text style={s.invKvDue}>{fmtDate(invoice.dueDate)}</Text>
            </View>
            <View style={s.invKv}>
              <Text style={s.invKvLabel}>Status</Text>
              <Text style={statusStyle(invoice.status)}>{STATUS_LABELS[invoice.status]}</Text>
            </View>
            {invoice.depositAmount ? (
              <View style={s.invKv}>
                <Text style={s.invKvLabel}>Deposit Received</Text>
                <Text style={s.invKvValue}>{fmt(invoice.depositAmount)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* TABLE HEADER */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.colDesc]}>Service Description</Text>
          <Text style={[s.tableHeaderText, s.colQty]}>Qty</Text>
          <Text style={[s.tableHeaderText, s.colAmt]}>Amount</Text>
        </View>

        {/* TABLE ROWS */}
        {invoice.items.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.cellText, s.colDesc]}>{item.description}</Text>
            <Text style={[s.cellMuted, s.colQty]}>{item.qty ?? "—"}</Text>
            <Text style={[s.cellMono, { ...s.colAmt, textAlign: "right" }]}>{fmt(item.amount)}</Text>
          </View>
        ))}

        {/* TOTALS */}
        <View style={s.totalsSection}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{fmt(invoice.subtotal)}</Text>
          </View>
          {invoice.depositAmount ? (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Deposit Received</Text>
              <Text style={s.depositValue}>−{fmt(invoice.depositAmount)}</Text>
            </View>
          ) : null}
          <View style={s.grandTotalBox}>
            <Text style={s.grandLabel}>
              {invoice.depositAmount ? "BALANCE DUE" : "TOTAL DUE"}
            </Text>
            <Text style={s.grandValue}>
              {invoice.depositAmount
                ? fmt(invoice.subtotal - invoice.depositAmount)
                : fmt(invoice.total)}
            </Text>
          </View>
        </View>

        {/* PAYMENT INFORMATION */}
        <View style={s.paySection}>
          <Text style={s.sectionTitle}>Payment Information</Text>
          {[
            ["Bank", "Bank of America"],
            ["Account Number", "139108056283"],
            ["Routing (Electronic)", "123103716"],
            ["Routing (Wire Transfer)", "026009593"],
            ["Zelle", "studio@tesographics.com"],
          ].map(([label, value]) => (
            <View key={label} style={s.payRow}>
              <Text style={s.payLabel}>{label}</Text>
              <Text style={s.payValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* PAYMENT TERMS & NOTES */}
        <View style={{ marginBottom: 8 }}>
          <Text style={s.sectionTitle}>Payment Terms & Notes</Text>
          <Text style={s.notesText}>
            Payment Due Upon Receipt.
            {"\n"}Late payments may incur a 5% monthly late fee.
            {"\n"}Final files and deliverables are released only after full payment is received.
            {"\n"}For questions regarding this invoice, contact studio@tesographics.com or (303) 525-3023.
          </Text>
          {invoice.notes ? (
            <Text style={[s.notesText, { marginTop: 8, fontFamily: "Helvetica-Oblique" }]}>{invoice.notes}</Text>
          ) : null}
        </View>

        {/* SIGNATURE — Authorized By only */}
        <View style={s.sigSection}>
          <View style={s.sigBlock}>
            <Text style={s.sigLabel}>Authorized By</Text>
            <View style={s.sigLine} />
            <Text style={s.sigCursive}>Alirio Castaneda</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Alirio Castaneda{"  "}|{"  "}studio@tesographics.com{"  "}|{"  "}(303) 525 3023{"  "}|{"  "}tesographics.com
          </Text>
          <Text style={s.footerText}>Invoice #{invoice.invoiceNumber}</Text>
        </View>

      </Page>
    </Document>
  );
}
