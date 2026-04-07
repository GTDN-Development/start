export type PlanKey = "free" | "startup" | "pro" | "enterprise";

interface Plan {
  key: PlanKey;
  highlighted: boolean;
  hasBillingToggle: boolean;
  featureKeys: string[];
  ctaHref: string;
}

export const plans: Plan[] = [
  {
    key: "free",
    highlighted: false,
    hasBillingToggle: false,
    featureKeys: ["feature1", "feature2", "feature3", "feature4"],
    ctaHref: "#",
  },
  {
    key: "startup",
    highlighted: false,
    hasBillingToggle: true,
    featureKeys: ["feature1", "feature2", "feature3", "feature4", "feature5", "feature6"],
    ctaHref: "#",
  },
  {
    key: "pro",
    highlighted: true,
    hasBillingToggle: true,
    featureKeys: ["feature1", "feature2", "feature3", "feature4", "feature5", "feature6"],
    ctaHref: "#",
  },
  {
    key: "enterprise",
    highlighted: false,
    hasBillingToggle: true,
    featureKeys: ["feature1", "feature2", "feature3", "feature4", "feature5"],
    ctaHref: "#",
  },
];

export const planKeys: PlanKey[] = ["free", "startup", "pro", "enterprise"];

type FeatureValue = true | null;

interface BooleanFeatureRow {
  key: string;
  values: Record<PlanKey, FeatureValue>;
}

interface StringFeatureRow {
  key: string;
  stringValues: true;
}

export type ComparisonFeatureRow = BooleanFeatureRow | StringFeatureRow;

export interface ComparisonSection {
  key: string;
  showTitle: boolean;
  features: ComparisonFeatureRow[];
}

export const comparisonSections: ComparisonSection[] = [
  {
    key: "usage",
    showTitle: false,
    features: [
      { key: "members", stringValues: true },
      { key: "transactions", stringValues: true },
      { key: "teams", stringValues: true },
    ],
  },
  {
    key: "features",
    showTitle: true,
    features: [
      { key: "reporting", values: { free: true, startup: true, pro: true, enterprise: true } },
      { key: "analytics", values: { free: true, startup: true, pro: true, enterprise: true } },
      { key: "importExport", values: { free: true, startup: true, pro: true, enterprise: true } },
      { key: "integrations", values: { free: true, startup: true, pro: true, enterprise: true } },
      { key: "aiAssistant", values: { free: null, startup: true, pro: true, enterprise: true } },
      { key: "adminRoles", values: { free: null, startup: null, pro: true, enterprise: true } },
      { key: "auditLog", values: { free: null, startup: null, pro: null, enterprise: true } },
    ],
  },
  {
    key: "support",
    showTitle: true,
    features: [
      {
        key: "prioritySupport",
        values: { free: true, startup: true, pro: true, enterprise: true },
      },
      {
        key: "accountManager",
        values: { free: null, startup: null, pro: null, enterprise: true },
      },
      { key: "uptimeSla", values: { free: null, startup: null, pro: null, enterprise: true } },
    ],
  },
];
