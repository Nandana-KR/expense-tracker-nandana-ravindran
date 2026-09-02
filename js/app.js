// app.js
// Entry point. Wires the modules together and starts the app.

import { addTransaction, getTransactions } from "./state.js";
import { elements, readForm, resetForm } from "./ui.js";

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

  console.log("[app] Transactions now:", getTransactions());
}

function init() {
  console.log("[Expense Tracker] App initialised");

  // Load and log any previously saved transactions.
  console.log("[Expense Tracker] Loaded transactions:", getTransactions());

  // Listen for form submissions.
  elements.form.addEventListener("submit", handleAddTransaction);
}

init();
