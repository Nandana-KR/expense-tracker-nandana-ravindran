// app.js
// Entry point. Wires the modules together and starts the app.

import { addTransaction, getTransactions } from "./state.js";
import { elements, readForm, resetForm, renderTransactions } from "./ui.js";

/**
 * Re-render everything that depends on the transaction data.
 */
function render() {
  const transactions = getTransactions();
  renderTransactions(transactions);
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

function init() {
  console.log("[Expense Tracker] App initialised");

  elements.form.addEventListener("submit", handleAddTransaction);

  // Initial paint from saved data.
  render();
}

init();
