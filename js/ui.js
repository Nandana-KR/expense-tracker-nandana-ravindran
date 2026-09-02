// ui.js
// Responsible for reading from and writing to the DOM. It does not hold data
// or business logic, it just reflects state onto the page and reads user input.

import { CATEGORIES, ALL_CATEGORIES } from "./constants.js";

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
  submitButton: document.querySelector("#transaction-form button[type='submit']"),
  filterType: document.getElementById("filter-type"),
  filterCategory: document.getElementById("filter-category"),
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
      <button type="button" class="btn-icon" data-action="edit" aria-label="Edit transaction">&#9998;</button>
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
    const filtersActive =
      elements.filterType.value !== "all" ||
      elements.filterCategory.value !== "all";
    elements.emptyState.textContent = filtersActive
      ? "No transactions match the selected filters."
      : "No transactions yet. Add one above to get started.";
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
 * Populate the form's category dropdown with the categories that belong to
 * the given transaction type (income or expense).
 * @param {string} type
 * @param {string} [selected] - a category to keep selected if it still exists
 */
export function populateCategoryOptions(type, selected) {
  const categories = CATEGORIES[type] || [];
  elements.category.innerHTML =
    `<option value="">Select category</option>` +
    categories
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");

  if (selected && categories.includes(selected)) {
    elements.category.value = selected;
  }
  console.log(`[ui] Category options set for type "${type}"`);
}

/**
 * Populate the filter category dropdown with every possible category.
 */
export function populateFilterCategories() {
  elements.filterCategory.innerHTML =
    `<option value="all">All categories</option>` +
    ALL_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
}

/**
 * Attach a listener that repopulates categories whenever the type changes.
 * @param {() => void} [onChange]
 */
export function bindTypeChange(onChange) {
  elements.type.addEventListener("change", () => {
    populateCategoryOptions(elements.type.value);
    if (onChange) onChange();
  });
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
 * Reset the form back to its default state and switch it back to "add" mode.
 */
export function resetForm() {
  elements.form.reset();
  // After reset the type falls back to its first option, so refresh categories.
  populateCategoryOptions(elements.type.value);
  elements.submitButton.textContent = "Add Transaction";
  clearErrors();
}

/**
 * Fill the form with an existing transaction's values (for editing) and
 * switch the submit button label to "Update Transaction".
 * @param {object} transaction
 */
export function fillForm(transaction) {
  elements.type.value = transaction.type;
  // Repopulate categories for this type, keeping the transaction's category selected.
  populateCategoryOptions(transaction.type, transaction.category);
  elements.amount.value = transaction.amount;
  elements.date.value = transaction.date;
  elements.description.value = transaction.description;
  elements.submitButton.textContent = "Update Transaction";
  elements.form.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Show validation error messages under their fields and highlight the inputs.
 * @param {Record<string, string>} errors - field -> message
 */
export function showErrors(errors) {
  // Clear existing errors first.
  clearErrors();

  for (const [field, message] of Object.entries(errors)) {
    const slot = document.querySelector(`[data-error-for="${field}"]`);
    if (slot) slot.textContent = message;

    const input = elements[field];
    if (input) input.classList.add("input--invalid");
  }
  console.warn("[ui] Validation errors shown:", errors);
}

/**
 * Remove all validation error messages and highlights.
 */
export function clearErrors() {
  document.querySelectorAll(".form__error").forEach((el) => {
    el.textContent = "";
  });
  ["amount", "category", "date", "description"].forEach((field) => {
    elements[field]?.classList.remove("input--invalid");
  });
}

/**
 * Read the currently selected filter values.
 * @returns {{ type: string, category: string }}
 */
export function readFilters() {
  return {
    type: elements.filterType.value,
    category: elements.filterCategory.value,
  };
}

/**
 * Attach change listeners to the filter dropdowns.
 * @param {() => void} onChange
 */
export function bindFilters(onChange) {
  elements.filterType.addEventListener("change", onChange);
  elements.filterCategory.addEventListener("change", onChange);
}

/**
 * Attach a single delegated click listener to the transaction list.
 * Calls the given handlers with the transaction id when an action is clicked.
 * @param {{ onDelete: (id:string) => void, onEdit: (id:string) => void }} handlers
 */
export function bindListActions({ onDelete, onEdit }) {
  elements.list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const item = event.target.closest(".transaction");
    const id = item?.dataset.id;
    if (!id) return;

    const action = button.dataset.action;
    if (action === "delete") {
      onDelete(id);
    } else if (action === "edit") {
      onEdit(id);
    }
  });
}
