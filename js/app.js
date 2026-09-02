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
  renderTransactions,
  renderSummary,
  bindListActions,
} from "./ui.js";

// Tracks which transaction is being edited. null means we are adding a new one.
let editingId = null;

/**
 * Re-render everything that depends on the transaction data.
 */
function render() {
  renderTransactions(getTransactions());
  renderSummary(getSummary());
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

  // Initial paint from saved data.
  render();
}

init();
