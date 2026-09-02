// constants.js
// Single source of truth for category options, split by transaction type.
// Keeping these here means the form, filters and any future feature all read
// from the same place.

export const CATEGORIES = {
  income: ["Salary", "Business", "Other"],
  expense: ["Food", "Transport", "Shopping", "Bills", "Rent", "Entertainment", "Other"],
};

// A flat, de-duplicated list of every category (used by the filter dropdown).
export const ALL_CATEGORIES = [
  ...new Set([...CATEGORIES.income, ...CATEGORIES.expense]),
];
