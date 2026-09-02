// app.js
// Entry point. Wires the modules together and starts the app.

import {
  addTransaction,
  getTransactions,
  getSummary,
  deleteTransaction,
} from "./state.js";
import {
  elements,
  readForm,
  resetForm,
  renderTransactions,
  renderSummary,
  bindListActions,
} from "./ui.js";

/**
 * Re-render everything that depends on the transaction data.
 */
function render() {
  renderTransactions(getTransactions());
  renderSummary(getSummary());
}

/**
 * Handle the Add Transaction form submission.
 * @param {SubmitEvent} event
 */
function handleAddTransaction(event) {
  event.preventDefault(); // stop the browser from reloading the page

  const data = readForm();
  console.log("[app] Form submitted with:", data);

  addTransaction(data);
  resetForm();
  render();
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
  render();
}

function init() {
  console.log("[Expense Tracker] App initialised");

  elements.form.addEventListener("submit", handleAddTransaction);
  bindListActions({ onDelete: handleDeleteTransaction });

  // Initial paint from saved data.
  render();
}

init();
