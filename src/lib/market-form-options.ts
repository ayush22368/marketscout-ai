export const BUDGET_UNITS = ["Thousand", "Lakh", "Crore"] as const;

export const CUSTOMER_OPTIONS = [
  "Students",
  "Parents",
  "Young professionals",
  "Working professionals",
  "Families",
  "Senior citizens",
  "Tourists",
  "Businesses",
  "Other",
] as const;

export function formatBudget(amount: string, unit: (typeof BUDGET_UNITS)[number]) {
  return amount.trim() ? `₹${amount.trim()} ${unit.toLowerCase()}` : "";
}