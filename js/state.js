// state.js
// The single source of truth for transaction data. It keeps the list of
// transactions in memory, exposes functions to change that list (add, edit,
// delete), computes summary totals, and persists every change via storage.js.
//
// The rest of the app should go through this module and never mutate the
// data directly. This keeps data flow predictable.

import { loadTransactions, saveTransactions } from "./storage.js";

// In-memory list. Initialised from Local Storage when the app starts.
let transactions = loadTransactions();

/**
 * Generate a reasonably unique id for a new transaction.
 * Uses crypto.randomUUID when available, with a timestamp fallback.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Return a copy of all transactions so callers cannot mutate internal state.
 * @returns {Array}
 */
export function getTransactions() {
  return [...transactions];
}

/**
 * Add a new transaction.
 * @param {{type:string, amount:number, category:string, date:string, description:string}} data
 * @returns {object} the created transaction (including its generated id)
 */
export function addTransaction(data) {
  const transaction = {
    id: generateId(),
    type: data.type,
    amount: Number(data.amount),
    category: data.category,
    date: data.date,
    description: data.description,
    createdAt: new Date().toISOString(),
  };

  transactions.push(transaction);
  saveTransactions(transactions);
  console.log("[state] Added transaction:", transaction);
  return transaction;
}

/**
 * Update an existing transaction by id.
 * @param {string} id
 * @param {object} updates - fields to change
 * @returns {object|null} the updated transaction, or null if not found
 */
export function updateTransaction(id, updates) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    console.warn("[state] Tried to update a transaction that does not exist:", id);
    return null;
  }

  transactions[index] = {
    ...transactions[index],
    ...updates,
    amount: updates.amount !== undefined ? Number(updates.amount) : transactions[index].amount,
  };

  saveTransactions(transactions);
  console.log("[state] Updated transaction:", transactions[index]);
  return transactions[index];
}

/**
 * Delete a transaction by id.
 * @param {string} id
 * @returns {boolean} true if a transaction was removed
 */
export function deleteTransaction(id) {
  const before = transactions.length;
  transactions = transactions.filter((t) => t.id !== id);
  const removed = transactions.length < before;

  if (removed) {
    saveTransactions(transactions);
    console.log("[state] Deleted transaction:", id);
  } else {
    console.warn("[state] Tried to delete a transaction that does not exist:", id);
  }
  return removed;
}

/**
 * Count how many transactions use a category name (used to guard deletes).
 * @param {string} categoryName
 * @returns {number}
 */
export function countTransactionsInCategory(categoryName) {
  return transactions.filter((t) => t.category === categoryName).length;
}
