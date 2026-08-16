// Static content for the "Maintenance & Support Plans" section shown on every
// quote (web preview + PDF). Not stored per-quote — edit here to update both.

export interface MaintenancePlan {
  id: string;
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
    id: "website-care",
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
    id: "qr-landing-page-care",
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
    id: "complete-digital-care",
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
  id: "hosting-only",
  label: "Hosting-Only Option",
  price: "$160",
  unit: "/ 2 years",
  description:
    "Includes website hosting. Updates, design changes, landing page changes, or technical support: $35/hour.",
};

// Hosting-Only expressed as a MaintenancePlan, so it can sit alongside the
// three monthly plans as the 4th card in a unified comparison grid.
export const HOSTING_ONLY_AS_PLAN: MaintenancePlan = {
  id: HOSTING_ONLY.id,
  name: "Hosting-Only",
  price: HOSTING_ONLY.price,
  unit: HOSTING_ONLY.unit,
  features: [HOSTING_ONLY.description],
};

// All four maintenance/support cards, in display order — single source of
// truth for both the editor preview and the PDF's card grid.
export const ALL_MAINTENANCE_CARDS: MaintenancePlan[] = [...MAINTENANCE_PLANS, HOSTING_ONLY_AS_PLAN];

export const MAINTENANCE_DISCLAIMER =
  "Note: Google Workspace / corporate email subscription fees are not included in any maintenance plan and are paid separately by the client.";

export const MAINTENANCE_NOTES: string[] = [
  "Maintenance plans are optional and billed monthly.",
  "Google Workspace/email subscription fees are not included.",
  "Minor updates and adjustments are included within the selected maintenance plan.",
  "Larger redesigns, new pages, major functionality changes, or work outside the agreed maintenance scope may be billed separately at $35/hour.",
  "The client may choose Website Care, QR Landing Page Care, Complete Digital Care, or the Hosting-Only option.",
];
