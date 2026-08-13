// Static content for the "Maintenance & Support Plans" section shown on every
// quote (web preview + PDF). Not stored per-quote — edit here to update both.

export interface MaintenancePlan {
  name: string;
  price: string;
  unit: string;
  features: string[];
  featured?: boolean;
  badge?: string;
  note?: string;
}

export const MAINTENANCE_PLANS: MaintenancePlan[] = [
  {
    name: "Website Care",
    price: "$140",
    unit: "/month",
    features: [
      "Website maintenance and updates",
      "Design and content adjustments",
      "Minor layout or visual changes",
      "Basic technical assistance",
    ],
  },
  {
    name: "QR Landing Page Care",
    price: "$40",
    unit: "/month",
    features: [
      "Ongoing maintenance of the QR landing page",
      "Updates to landing page content",
      "Minor design adjustments",
      "QR code functionality support",
    ],
  },
  {
    name: "Complete Digital Care",
    price: "$170",
    unit: "/month",
    featured: true,
    badge: "Recommended",
    features: [
      "Everything in Website Care",
      "Everything in QR Landing Page Care",
      "Corporate email assistance",
      "Ongoing minor website & landing page updates",
      "Design and technical support",
    ],
    note: "Save $10/month compared to purchasing Website Care and QR Landing Page Care separately.",
  },
];

export const HOSTING_ONLY = {
  label: "Hosting-Only Option",
  price: "$160",
  unit: "/ 2 years",
  description:
    "Includes website hosting. Updates, design changes, landing page changes, or technical support: $35/hour.",
};

export const MAINTENANCE_DISCLAIMER =
  "Note: Google Workspace / corporate email subscription fees are not included in any maintenance plan and are paid separately by the client.";

export const MAINTENANCE_NOTES: string[] = [
  "Maintenance plans are optional and billed monthly.",
  "Google Workspace/email subscription fees are not included.",
  "Minor updates and adjustments are included within the selected maintenance plan.",
  "Larger redesigns, new pages, major functionality changes, or work outside the agreed maintenance scope may be billed separately at $35/hour.",
  "The client may choose Website Care, QR Landing Page Care, Complete Digital Care, or the Hosting-Only option.",
];

// Compact bullet content for the PDF's "Website & Digital Support" section —
// a condensed summary of MAINTENANCE_PLANS for print, kept short on purpose.
export const WEBSITE_DIGITAL_SUPPORT: string[] = [
  "Website Care — $140/month",
  "QR Landing Page Care — $40/month",
  "Complete Digital Care — $170/month — Website + Landing Page",
  "Google Workspace fees are billed separately by Google.",
  "Major work outside the selected plan is billed at $35/hour.",
];
