// app.js
// Entry point. Wires the modules together and starts the app.

import {
  addTransaction,
  getTransactions,
  getSummary,
  deleteTransaction,
  updateTransaction,
} from "./state.js";
import {
  elements,
  readForm,
  resetForm,
  fillForm,
  readFilters,
  bindFilters,
  renderTransactions,
  renderSummary,
  bindListActions,
} from "./ui.js";

// Tracks which transaction is being edited. null means we are adding a new one.
let editingId = null;

/**
 * Apply the active type and category filters to a list of transactions.
 * @param {Array} transactions
 * @returns {Array}
 */
function applyFilters(transactions) {
  const { type, category } = readFilters();

  return transactions.filter((t) => {
    const matchesType = type === "all" || t.type === type;
    const matchesCategory = category === "all" || t.category === category;
    return matchesType && matchesCategory;
  });
}

/**
 * Re-render everything. Totals always reflect ALL transactions, while the
 * list reflects the current filters.
 */
function render() {
  const all = getTransactions();
  const visible = applyFilters(all);

  renderTransactions(visible);
  renderSummary(getSummary());

  console.log(`[app] Showing ${visible.length} of ${all.length} transaction(s)`);
}

/**
 * Handle the form submission. Adds a new transaction, or updates the existing
 * one when we are in edit mode.
 * @param {SubmitEvent} event
 */
function handleSubmit(event) {
  event.preventDefault(); // stop the browser from reloading the page

  const data = readForm();

  if (editingId) {
    console.log("[app] Updating transaction:", editingId, data);
    updateTransaction(editingId, data);
    editingId = null;
  } else {
    console.log("[app] Adding transaction:", data);
    addTransaction(data);
  }

  resetForm();
  render();
}

/**
 * Load a transaction into the form for editing.
 * @param {string} id
 */
function handleEditTransaction(id) {
  const transaction = getTransactions().find((t) => t.id === id);
  if (!transaction) {
    console.warn("[app] Cannot edit, transaction not found:", id);
    return;
  }

  editingId = id;
  fillForm(transaction);
  console.log("[app] Editing transaction:", id);
}

/**
 * Handle deleting a transaction after confirmation.
 * @param {string} id
 */
function handleDeleteTransaction(id) {
  const confirmed = window.confirm("Delete this transaction?");
  if (!confirmed) {
    console.log("[app] Delete cancelled for:", id);
    return;
  }

  deleteTransaction(id);

  // If we were editing this transaction, cancel edit mode.
  if (editingId === id) {
    editingId = null;
    resetForm();
  }

  render();
}

function init() {
  console.log("[Expense Tracker] App initialised");

  elements.form.addEventListener("submit", handleSubmit);
  bindListActions({
    onDelete: handleDeleteTransaction,
    onEdit: handleEditTransaction,
  });
  bindFilters(render);

  // Initial paint from saved data.
  render();
}

init();
