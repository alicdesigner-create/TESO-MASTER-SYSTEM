import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Quote, Client } from "@/lib/types";
import { formatLocalDate } from "@/lib/date";
import { HOSTING_ONLY, WEBSITE_DIGITAL_SUPPORT } from "@/lib/maintenancePlans";

const C = {
  carbon: "#202120",
  carbonLight: "#2c2d2c",
  beige: "#c8b299",
  textPrimary: "#f0ece6",
  textDark: "#222222",
  textMuted: "#777777",
  border: "#e0dbd5",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: { backgroundColor: C.white, paddingHorizontal: 44, paddingTop: 40, paddingBottom: 56, fontFamily: "Helvetica", fontSize: 9, color: C.textDark },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  logoBox: { flexDirection: "column" },
  logoName: { fontSize: 17, fontFamily: "Helvetica-Bold", color: C.carbon, letterSpacing: 2 },
  logoSub: { fontSize: 7.5, color: C.textMuted, letterSpacing: 1, marginTop: 2 },
  logoContact: { fontSize: 7.5, color: C.textMuted, marginTop: 6, lineHeight: 1.7 },
  docLabel: { fontSize: 36, fontFamily: "Helvetica-Bold", color: C.carbon, letterSpacing: 3, textAlign: "right" },
  // Divider
  divider: { borderBottom: 1, borderColor: C.border, marginVertical: 14 },
  // Meta row
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  metaLeft: { flexDirection: "column" },
  metaTag: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.beige, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  metaClientName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.carbon },
  metaDetail: { fontSize: 8, color: C.textMuted, marginTop: 2 },
  metaRight: { alignItems: "flex-end" },
  metaKv: { flexDirection: "row", marginBottom: 3 },
  metaKvLabel: { fontSize: 8, color: C.textMuted, width: 76, textAlign: "right", marginRight: 8 },
  metaKvValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.carbon, width: 88 },
  // Table
  tableHeader: { flexDirection: "row", backgroundColor: C.beige, paddingVertical: 6, paddingHorizontal: 8 },
  tableHeaderText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.carbon, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottom: 1, borderColor: "#f0ede8" },
  tableRowAlt: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottom: 1, borderColor: "#f0ede8", backgroundColor: "#faf8f5" },
  colQty: { width: "10%", textAlign: "center" },
  colDesc: { width: "68%" },
  colAmt: { width: "22%", textAlign: "right" },
  cellText: { fontSize: 8.5, color: C.textDark },
  cellMuted: { fontSize: 8.5, color: C.textMuted },
  cellMono: { fontSize: 8.5, color: C.textDark, fontFamily: "Courier" },
  // Totals
  totalsSection: { alignItems: "flex-end", marginTop: 10, marginBottom: 20 },
  totalRow: { flexDirection: "row", width: 230, justifyContent: "space-between", paddingVertical: 4, borderBottom: 1, borderColor: "#eeeeee" },
  totalLabel: { fontSize: 8.5, color: C.textMuted },
  totalValue: { fontSize: 8.5, color: C.textDark, fontFamily: "Courier" },
  grandTotalBox: { flexDirection: "row", width: 230, justifyContent: "space-between", paddingVertical: 9, paddingHorizontal: 10, backgroundColor: C.carbon, marginTop: 5 },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.textPrimary },
  grandValue: { fontSize: 11, fontFamily: "Courier-Bold", color: C.beige },
  // Sections
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.carbon, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, paddingBottom: 4, borderBottom: 1, borderColor: C.border },
  termText: { fontSize: 7.5, color: C.textMuted, lineHeight: 1.7, marginBottom: 3 },
  termBullet: { fontSize: 8, color: C.textMuted, lineHeight: 1.9, marginBottom: 7 },
  // Hosting-only option
  hostingBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: C.border, borderStyle: "dashed", borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, marginBottom: 10, backgroundColor: "#fbfbfa" },
  hostingLeft: { flexDirection: "column", flexShrink: 1, paddingRight: 10 },
  hostingLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  hostingDesc: { fontSize: 7.3, color: C.textMuted, lineHeight: 1.5 },
  hostingPriceBox: { alignItems: "flex-end" },
  hostingPrice: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.carbon },
  hostingPriceUnit: { fontSize: 7, color: C.textMuted },
  // Signatures
  sigSection: { flexDirection: "row", marginTop: 42, gap: 24 },
  sigBlock: { flex: 1 },
  sigLabel: { fontSize: 7, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 22 },
  sigLine: { borderBottom: 1, borderColor: "#cccccc", marginBottom: 4 },
  sigName: { fontSize: 8, color: C.textMuted },
  // Footer
  footer: { position: "absolute", bottom: 20, left: 44, right: 44, borderTop: 1, borderColor: C.border, paddingTop: 7, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: C.textMuted },
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtDate(iso: string) {
  return formatLocalDate(iso, { year: "numeric", month: "long", day: "numeric" });
}

interface Props {
  quote: Quote;
  client: Client | null;
}

function buildTerms(validDays: number): string[] {
  return [
    "50% deposit required to begin; balance due upon completion.",
    "Up to 3 revisions included per graphic piece; additional revisions — $30/hour.",
    "Final files delivered after full payment.",
    `Quote valid for ${validDays} days.`,
    "Printing orders are non-refundable once approved.",
  ];
}

export default function QuotePDF({ quote, client }: Props) {
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <Text style={s.logoName}>TESO GRAPHICS</Text>
            <Text style={s.logoSub}>DIGITAL PRODUCT & BRAND DESIGN</Text>
            <Text style={s.logoContact}>
              studio@tesographics.com{"  "}|{"  "}(303) 525-3023{"\n"}tesographics.com{"  "}|{"  "}Denver, CO
            </Text>
          </View>
          <Text style={s.docLabel}>QUOTE</Text>
        </View>

        <View style={s.divider} />

        {/* META */}
        <View style={s.metaRow}>
          <View style={s.metaLeft}>
            <Text style={s.metaTag}>Quote For</Text>
            <Text style={s.metaClientName}>{client?.contactName ?? "—"}</Text>
            <Text style={s.metaDetail}>{client?.businessName ?? ""}</Text>
            {client?.email ? <Text style={s.metaDetail}>{client.email}</Text> : null}
            {client?.phone ? <Text style={s.metaDetail}>{client.phone}</Text> : null}
          </View>
          <View style={s.metaRight}>
            <View style={s.metaKv}>
              <Text style={s.metaKvLabel}>Quote #</Text>
              <Text style={s.metaKvValue}>{quote.quoteNumber}</Text>
            </View>
            <View style={s.metaKv}>
              <Text style={s.metaKvLabel}>Date</Text>
              <Text style={s.metaKvValue}>{fmtDate(quote.date)}</Text>
            </View>
            <View style={s.metaKv}>
              <Text style={s.metaKvLabel}>Valid</Text>
              <Text style={s.metaKvValue}>{quote.validDays} days</Text>
            </View>
            <View style={s.metaKv}>
              <Text style={s.metaKvLabel}>Prepared by</Text>
              <Text style={s.metaKvValue}>Alirio Castaneda</Text>
            </View>
          </View>
        </View>

        {/* TABLE HEADER */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.colQty]}>Qty</Text>
          <Text style={[s.tableHeaderText, s.colDesc]}>Service Description</Text>
          <Text style={[s.tableHeaderText, s.colAmt]}>Amount</Text>
        </View>

        {/* TABLE ROWS */}
        {quote.items.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.cellMuted, s.colQty]}>{item.qty}</Text>
            <Text style={[s.cellText, s.colDesc]}>{item.description}</Text>
            <Text style={[s.cellMono, s.colAmt]}>{fmt(item.qty * item.unitPrice)}</Text>
          </View>
        ))}

        {/* TOTALS */}
        <View style={s.totalsSection}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{fmt(quote.subtotal)}</Text>
          </View>
          {quote.taxRate > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Tax ({quote.taxRate}%)</Text>
              <Text style={s.totalValue}>{fmt(quote.taxAmount)}</Text>
            </View>
          )}
          <View style={s.grandTotalBox}>
            <Text style={s.grandLabel}>TOTAL</Text>
            <Text style={s.grandValue}>{fmt(quote.total)}</Text>
          </View>
        </View>

        {/* WEBSITE & DIGITAL SUPPORT + HOSTING-ONLY (optional, per-quote toggle) */}
        {quote.includeMaintenancePlans && (
        <View wrap={false}>
          <Text style={s.sectionTitle}>Website & Digital Support</Text>
          {WEBSITE_DIGITAL_SUPPORT.map((line, i) => (
            <Text key={i} style={s.termText}>• {line}</Text>
          ))}

          <View style={s.hostingBox}>
            <View style={s.hostingLeft}>
              <Text style={s.hostingLabel}>{HOSTING_ONLY.label}</Text>
              <Text style={s.hostingDesc}>{HOSTING_ONLY.description}</Text>
            </View>
            <View style={s.hostingPriceBox}>
              <Text style={s.hostingPrice}>{HOSTING_ONLY.price}</Text>
              <Text style={s.hostingPriceUnit}>{HOSTING_ONLY.unit}</Text>
            </View>
          </View>
        </View>
        )}

        {/* TERMS & ACCEPTANCE — dedicated page, always starts clean at the top */}
        <View break>
          <Text style={s.sectionTitle}>Terms and Conditions</Text>
          {buildTerms(quote.validDays).map((t, i) => (
            <Text key={i} style={s.termBullet}>• {t}</Text>
          ))}

          {/* SIGNATURES */}
          <View style={s.sigSection}>
            <View style={s.sigBlock}>
              <Text style={s.sigLabel}>Prepared by</Text>
              <View style={s.sigLine} />
              <Text style={s.sigName}>Alirio Castaneda — Teso Graphics LLC</Text>
            </View>
            <View style={s.sigBlock}>
              <Text style={s.sigLabel}>Accepted by</Text>
              <View style={s.sigLine} />
              <Text style={s.sigName}>{client?.contactName ?? "Client Signature"}</Text>
            </View>
            <View style={s.sigBlock}>
              <Text style={s.sigLabel}>Date</Text>
              <View style={s.sigLine} />
              <Text style={s.sigName}> </Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Alirio Castaneda{"  "}|{"  "}studio@tesographics.com{"  "}|{"  "}(303) 525 3023{"  "}|{"  "}tesographics.com
          </Text>
          <Text style={s.footerText}>
            Web Design  ·  Branding  ·  Print Design  ·  Social Media
          </Text>
        </View>
      </Page>
    </Document>
  );
}
