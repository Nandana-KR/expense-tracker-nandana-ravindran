// storage.js
// Responsible ONLY for reading and writing transactions to the browser's
// Local Storage. Keeping this isolated means the rest of the app never talks
// to localStorage directly, so if we ever change how data is stored, we only
// touch this file.

const STORAGE_KEY = "expense-tracker:transactions";

/**
 * Load all saved transactions from Local Storage.
 * Returns an empty array if nothing is saved or the data is corrupted.
 * @returns {Array} list of transaction objects
 */
export function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.log("[storage] No saved transactions found, starting fresh");
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("[storage] Saved data was not an array, ignoring it");
      return [];
    }

    console.log(`[storage] Loaded ${parsed.length} transaction(s)`);
    return parsed;
  } catch (error) {
    // JSON could be corrupted, or storage could be blocked (private mode).
    console.error("[storage] Failed to load transactions:", error);
    return [];
  }
}

/**
 * Save the full list of transactions to Local Storage.
 * @param {Array} transactions - list of transaction objects to persist
 * @returns {boolean} true if saved successfully, false otherwise
 */
export function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    console.log(`[storage] Saved ${transactions.length} transaction(s)`);
    return true;
  } catch (error) {
    // Storage can fail if it is full or disabled by the browser.
    console.error("[storage] Failed to save transactions:", error);
    return false;
  }
}
