// app.js
// Entry point. Wires the modules together and starts the app.

import { loadTransactions } from "./storage.js";

function init() {
  console.log("[Expense Tracker] App initialised");

  // Load any previously saved transactions (empty array on first run).
  const transactions = loadTransactions();
  console.log("[Expense Tracker] Current transactions:", transactions);
}

init();
