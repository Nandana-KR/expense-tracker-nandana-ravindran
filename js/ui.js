// ui.js
// Responsible for reading from and writing to the DOM. It does not hold data
// or business logic, it just reflects state onto the page and reads user input.

// Cache references to the elements we interact with often.
export const elements = {
  form: document.getElementById("transaction-form"),
  type: document.getElementById("type"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  date: document.getElementById("date"),
  description: document.getElementById("description"),
  list: document.getElementById("transaction-list"),
  emptyState: document.getElementById("empty-state"),
  balance: document.getElementById("balance"),
  totalIncome: document.getElementById("total-income"),
  totalExpense: document.getElementById("total-expense"),
};

/**
 * Format a number as currency for display.
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return `₹${Number(value).toFixed(2)}`;
}

/**
 * Format an ISO date string (yyyy-mm-dd) into a readable form.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Build a single transaction list item element.
 * @param {object} transaction
 * @returns {HTMLLIElement}
 */
function createTransactionItem(transaction) {
  const li = document.createElement("li");
  li.className = `transaction transaction--${transaction.type}`;
  li.dataset.id = transaction.id;

  const sign = transaction.type === "income" ? "+" : "-";

  li.innerHTML = `
    <div class="transaction__info">
      <span class="transaction__description">${transaction.description || transaction.category}</span>
      <span class="transaction__meta">${transaction.category} &middot; ${formatDate(transaction.date)}</span>
    </div>
    <span class="transaction__amount">${sign}${formatCurrency(transaction.amount)}</span>
    <div class="transaction__actions">
      <button type="button" class="btn-icon" data-action="delete" aria-label="Delete transaction">&times;</button>
    </div>
  `;

  return li;
}

/**
 * Render the full list of transactions into the page.
 * Shows the empty state when there are none.
 * @param {Array} transactions
 */
export function renderTransactions(transactions) {
  elements.list.innerHTML = "";

  if (!transactions.length) {
    elements.emptyState.style.display = "block";
    console.log("[ui] No transactions to render, showing empty state");
    return;
  }

  elements.emptyState.style.display = "none";

  // Newest first.
  const ordered = [...transactions].reverse();
  for (const transaction of ordered) {
    elements.list.appendChild(createTransactionItem(transaction));
  }

  console.log(`[ui] Rendered ${transactions.length} transaction(s)`);
}

/**
 * Render the income, expense and balance totals into the summary cards.
 * @param {{income:number, expense:number, balance:number}} summary
 */
export function renderSummary(summary) {
  elements.totalIncome.textContent = formatCurrency(summary.income);
  elements.totalExpense.textContent = formatCurrency(summary.expense);
  elements.balance.textContent = formatCurrency(summary.balance);
  console.log("[ui] Rendered summary:", summary);
}

/**
 * Read the current values from the transaction form.
 * @returns {{type:string, amount:string, category:string, date:string, description:string}}
 */
export function readForm() {
  return {
    type: elements.type.value,
    amount: elements.amount.value.trim(),
    category: elements.category.value,
    date: elements.date.value,
    description: elements.description.value.trim(),
  };
}

/**
 * Reset the form back to its default state after a successful add.
 */
export function resetForm() {
  elements.form.reset();
}

/**
 * Attach a single delegated click listener to the transaction list.
 * Calls the given handlers with the transaction id when an action is clicked.
 * @param {{ onDelete: (id:string) => void }} handlers
 */
export function bindListActions({ onDelete }) {
  elements.list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const item = event.target.closest(".transaction");
    const id = item?.dataset.id;
    if (!id) return;

    const action = button.dataset.action;
    if (action === "delete") {
      onDelete(id);
    }
  });
}
