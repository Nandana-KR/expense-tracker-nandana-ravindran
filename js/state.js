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
 * Compute summary totals from the current transactions.
 * @returns {{income:number, expense:number, balance:number}}
 */
export function getSummary() {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (t.type === "income") {
      income += t.amount;
    } else if (t.type === "expense") {
      expense += t.amount;
    }
  }

  const summary = {
    income,
    expense,
    balance: income - expense,
  };

  console.log("[state] Summary computed:", summary);
  return summary;
}

/**
 * List the distinct months (YYYY-MM) that have transactions, newest first.
 * @returns {string[]}
 */
export function getAvailableMonths() {
  const months = new Set();
  for (const t of transactions) {
    if (t.date && t.date.length >= 7) {
      months.add(t.date.slice(0, 7)); // "YYYY-MM"
    }
  }
  return [...months].sort().reverse();
}

/**
 * Compute income, expense and balance for a single month.
 * @param {string} month - in "YYYY-MM" format
 * @returns {{income:number, expense:number, balance:number}}
 */
export function getMonthlySummary(month) {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (!t.date || t.date.slice(0, 7) !== month) continue;
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
  }

  const summary = { income, expense, balance: income - expense };
  console.log(`[state] Monthly summary for ${month}:`, summary);
  return summary;
}

/**
 * Sum expenses per category for a given month.
 * @param {string} month - "YYYY-MM"
 * @returns {Array<{category:string, total:number}>} sorted by total, high to low
 */
export function getExpenseByCategory(month) {
  const totals = {};

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (month && (!t.date || t.date.slice(0, 7) !== month)) continue;
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }

  const result = Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  console.log(`[state] Expense by category for ${month}:`, result);
  return result;
}

/**
 * Get the current month and previous month as "YYYY-MM" strings.
 * @returns {{current:string, previous:string}}
 */
function getCurrentAndPreviousMonth() {
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previous = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  return { current, previous };
}

/**
 * Calculate the percentage change from a previous value to a current value.
 * Returns null when there is no meaningful comparison (previous is zero).
 * @param {number} current
 * @param {number} previous
 * @returns {number|null}
 */
function percentChange(current, previous) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Build the dashboard statistics: overall totals plus month-over-month
 * percentage changes for balance, income and expense.
 * @returns {object}
 */
export function getDashboardStats() {
  const overall = getSummary();
  const { current, previous } = getCurrentAndPreviousMonth();
  const thisMonth = getMonthlySummary(current);
  const lastMonth = getMonthlySummary(previous);

  const stats = {
    balance: overall.balance,
    income: overall.income,
    expense: overall.expense,
    count: transactions.length,
    change: {
      balance: percentChange(thisMonth.balance, lastMonth.balance),
      income: percentChange(thisMonth.income, lastMonth.income),
      expense: percentChange(thisMonth.expense, lastMonth.expense),
    },
  };

  console.log("[state] Dashboard stats:", stats);
  return stats;
}

/**
 * Sum amounts per category for a given type, across all time.
 * @param {"income"|"expense"} type
 * @returns {Array<{category:string, total:number}>} sorted high to low
 */
export function getTotalsByCategory(type) {
  const totals = {};
  for (const t of transactions) {
    if (t.type !== type) continue;
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }
  return Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * For a given category name, count its transactions and sum their amounts.
 * @param {string} categoryName
 * @returns {{count:number, total:number}}
 */
export function getCategoryStats(categoryName) {
  let count = 0;
  let total = 0;
  for (const t of transactions) {
    if (t.category === categoryName) {
      count += 1;
      total += t.amount;
    }
  }
  return { count, total };
}

/**
 * Count how many transactions use a category name (used to guard deletes).
 * @param {string} categoryName
 * @returns {number}
 */
export function countTransactionsInCategory(categoryName) {
  return transactions.filter((t) => t.category === categoryName).length;
}

/**
 * Compute balance, income, expense and transaction count for a period.
 * @param {string|null} month - "YYYY-MM" for a single month, or null/"all" for all time
 * @returns {{balance:number, income:number, expense:number, count:number}}
 */
export function getPeriodStats(month) {
  const scoped =
    !month || month === "all"
      ? transactions
      : transactions.filter((t) => t.date && t.date.slice(0, 7) === month);

  let income = 0;
  let expense = 0;
  for (const t of scoped) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
  }

  return {
    balance: income - expense,
    income,
    expense,
    count: scoped.length,
  };
}
