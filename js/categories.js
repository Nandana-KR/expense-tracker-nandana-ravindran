// categories.js
// Categories are stored data (not a fixed list), so users can add, edit and
// delete their own. This module owns the category list, persists it to Local
// Storage, and seeds sensible defaults on first run.

const STORAGE_KEY = "expense-tracker:categories";

// Default categories used the first time the app runs. Each has an icon and a
// colour so the UI can render them consistently.
const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", type: "expense", icon: "🍽️", color: "#f97316", description: "Meals, groceries and eating out" },
  { name: "Transport", type: "expense", icon: "🚗", color: "#2563eb", description: "Fuel, cabs and public transport" },
  { name: "Shopping", type: "expense", icon: "🛍️", color: "#9333ea", description: "Clothes, gadgets and general shopping" },
  { name: "Bills & Utilities", type: "expense", icon: "💡", color: "#0891b2", description: "Electricity, water, internet and phone" },
  { name: "Entertainment", type: "expense", icon: "🎬", color: "#e11d48", description: "Movies, games and subscriptions" },
  { name: "Others", type: "expense", icon: "📦", color: "#64748b", description: "Miscellaneous expenses" },
  { name: "Salary", type: "income", icon: "💼", color: "#16a34a", description: "Monthly salary and wages" },
  { name: "Business", type: "income", icon: "📈", color: "#0d9488", description: "Business and freelance income" },
  { name: "Other Income", type: "income", icon: "💰", color: "#ca8a04", description: "Interest, gifts and refunds" },
];

let categories = load();

/** Generate a unique id. */
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Load categories from storage, seeding defaults on first run. */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = DEFAULT_CATEGORIES.map((c) => ({ id: generateId(), ...c }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      console.log("[categories] Seeded default categories");
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    console.log(`[categories] Loaded ${parsed.length} categories`);
    return parsed;
  } catch (error) {
    console.error("[categories] Failed to load, using defaults:", error);
    return DEFAULT_CATEGORIES.map((c) => ({ id: generateId(), ...c }));
  }
}

/** Persist the current list. */
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    console.log(`[categories] Saved ${categories.length} categories`);
    return true;
  } catch (error) {
    console.error("[categories] Failed to save:", error);
    return false;
  }
}

/** Return a copy of all categories. */
export function getCategories() {
  return [...categories];
}

/** Return category names for a given type (income/expense). */
export function getCategoryNames(type) {
  return categories.filter((c) => c.type === type).map((c) => c.name);
}

/** Return every category name (both types), de-duplicated. */
export function getAllCategoryNames() {
  return [...new Set(categories.map((c) => c.name))];
}

/**
 * Add a new category.
 * @param {{name:string, type:string, icon:string, color:string, description:string}} data
 * @returns {object}
 */
export function addCategory(data) {
  const category = {
    id: generateId(),
    name: data.name.trim(),
    type: data.type,
    icon: data.icon || "🏷️",
    color: data.color || "#2563eb",
    description: data.description?.trim() || "",
  };
  categories.push(category);
  save();
  console.log("[categories] Added:", category);
  return category;
}

/** Update a category by id. */
export function updateCategory(id, updates) {
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return null;
  categories[index] = { ...categories[index], ...updates };
  save();
  console.log("[categories] Updated:", categories[index]);
  return categories[index];
}

/** Delete a category by id. */
export function deleteCategory(id) {
  const before = categories.length;
  categories = categories.filter((c) => c.id !== id);
  const removed = categories.length < before;
  if (removed) save();
  return removed;
}

/** True if a name already exists (optionally excluding one id, for edits). */
export function categoryNameExists(name, exceptId) {
  const lower = name.trim().toLowerCase();
  return categories.some(
    (c) => c.name.toLowerCase() === lower && c.id !== exceptId
  );
}
