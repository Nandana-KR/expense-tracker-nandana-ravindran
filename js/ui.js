// ui.js
// Responsible for reading from and writing to the DOM. It holds no business
// data, it only reflects state onto the page and reads user input.

import { CATEGORIES, ALL_CATEGORIES } from "./constants.js";

// Cache references to the elements we interact with often.
export const elements = {
  // Add form
  form: document.getElementById("transaction-form"),
  type: document.getElementById("type"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  date: document.getElementById("date"),
  description: document.getElementById("description"),
  submitButton: document.querySelector("#transaction-form button[type='submit']"),
  cancelButton: document.getElementById("cancel-edit"),
  typeTabs: document.querySelectorAll(".type-tab"),

  // Transactions view
  tbody: document.getElementById("tx-tbody"),
  emptyState: document.getElementById("empty-state"),
  txSummary: document.getElementById("tx-summary"),
  search: document.getElementById("search"),
  filterType: document.getElementById("filter-type"),
  filterCategory: document.getElementById("filter-category"),
  filterMonth: document.getElementById("filter-month"),
  loadMore: document.getElementById("load-more"),

  // Dashboard view
  statBalance: document.getElementById("stat-balance"),
  statIncome: document.getElementById("stat-income"),
  statExpense: document.getElementById("stat-expense"),
  statCount: document.getElementById("stat-count"),
  changeBalance: document.getElementById("change-balance"),
  changeIncome: document.getElementById("change-income"),
  changeExpense: document.getElementById("change-expense"),
  recentList: document.getElementById("recent-list"),
  recentEmpty: document.getElementById("recent-empty"),
  donut: document.getElementById("donut"),
  donutEmpty: document.getElementById("donut-empty"),
  donutScope: document.getElementById("donut-scope"),

  // Categories view
  catExpense: document.getElementById("cat-expense"),
  catExpenseEmpty: document.getElementById("cat-expense-empty"),
  catIncome: document.getElementById("cat-income"),
  catIncomeEmpty: document.getElementById("cat-income-empty"),

  // Reports view
  monthSelect: document.getElementById("month-select"),
  monthIncome: document.getElementById("month-income"),
  monthExpense: document.getElementById("month-expense"),
  monthNet: document.getElementById("month-net"),
  monthlyEmpty: document.getElementById("monthly-empty"),
  chartBars: document.getElementById("chart-bars"),
  chartEmpty: document.getElementById("chart-empty"),
};

/* ============================ Formatting ============================ */

/**
 * Format a number as currency for display.
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
 * Turn a "YYYY-MM" string into a readable label like "March 2026".
 * @param {string} month
 * @returns {string}
 */
function formatMonthLabel(month) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/* ============================ Transaction list ============================ */

/**
 * Build a single transaction list item element.
 * @param {object} transaction
 * @param {boolean} [withActions] - include edit/delete buttons
 * @returns {HTMLLIElement}
 */
function createTransactionItem(transaction, withActions = true) {
  const li = document.createElement("li");
  li.className = `transaction transaction--${transaction.type}`;
  li.dataset.id = transaction.id;

  const sign = transaction.type === "income" ? "+" : "-";
  const actions = withActions
    ? `<div class="transaction__actions">
         <button type="button" class="btn-icon" data-action="edit" aria-label="Edit transaction">&#9998;</button>
         <button type="button" class="btn-icon" data-action="delete" aria-label="Delete transaction">&times;</button>
       </div>`
    : "";

  li.innerHTML = `
    <div class="transaction__info">
      <span class="transaction__description">${transaction.description || transaction.category}</span>
      <span class="transaction__meta">${transaction.category} &middot; ${formatDate(transaction.date)}</span>
    </div>
    <span class="transaction__amount">${sign}${formatCurrency(transaction.amount)}</span>
    ${actions}
  `;
  return li;
}

/**
 * Build a single transaction table row.
 * @param {object} t
 * @returns {string} HTML for a <tr>
 */
function createTransactionRow(t) {
  const sign = t.type === "income" ? "+" : "-";
  const typeBadge = `<span class="badge badge--${t.type}">${t.type}</span>`;
  return `
    <tr data-id="${t.id}">
      <td data-label="Date">${formatDate(t.date)}</td>
      <td data-label="Description">${t.description || "—"}</td>
      <td data-label="Category">${t.category}</td>
      <td data-label="Type">${typeBadge}</td>
      <td data-label="Amount" class="tx-table__num tx-amount tx-amount--${t.type}">
        ${sign}${formatCurrency(t.amount)}
      </td>
      <td data-label="Actions" class="tx-table__actions-col">
        <button type="button" class="btn-icon" data-action="edit" aria-label="Edit">&#9998;</button>
        <button type="button" class="btn-icon" data-action="delete" aria-label="Delete">&times;</button>
      </td>
    </tr>`;
}

/**
 * Render the filtered transactions as a table, limited to `visibleCount`
 * (for the load-more pagination). Also updates the summary line and the
 * load-more button.
 * @param {Array} transactions - already filtered, newest-first order applied here
 * @param {number} visibleCount - how many to show
 * @param {{income:number, expense:number}} totals - totals of the filtered set
 */
export function renderTransactions(transactions, visibleCount, totals) {
  const ordered = [...transactions].reverse();
  const shown = ordered.slice(0, visibleCount);

  elements.tbody.innerHTML = shown.map(createTransactionRow).join("");

  // Empty state.
  const anyData = transactions.length > 0;
  elements.emptyState.style.display = anyData ? "none" : "block";
  const filtersActive =
    elements.filterType.value !== "all" ||
    elements.filterCategory.value !== "all" ||
    elements.filterMonth.value !== "all" ||
    elements.search.value.trim() !== "";
  elements.emptyState.textContent = filtersActive
    ? "No transactions match your search or filters."
    : "No transactions yet. Add one to get started.";

  // Load-more button.
  elements.loadMore.hidden = shown.length >= transactions.length;

  // Summary line.
  const count = transactions.length;
  elements.txSummary.textContent =
    `${count} transaction${count === 1 ? "" : "s"} · ` +
    `Income ${formatCurrency(totals.income)} · Expense ${formatCurrency(totals.expense)}`;

  console.log(`[ui] Rendered ${shown.length} of ${count} transaction(s)`);
}

/**
 * Read the search text.
 * @returns {string}
 */
export function getSearchText() {
  return elements.search.value.trim().toLowerCase();
}

/**
 * Populate the month filter dropdown.
 * @param {string[]} months - "YYYY-MM" list, newest first
 */
export function populateMonthFilter(months) {
  const previous = elements.filterMonth.value;
  elements.filterMonth.innerHTML =
    `<option value="all">All months</option>` +
    months.map((m) => `<option value="${m}">${formatMonthLabel(m)}</option>`).join("");
  if (previous === "all" || months.includes(previous)) {
    elements.filterMonth.value = previous;
  }
}

/**
 * Bind search, type, category and month filter changes.
 * @param {() => void} onChange
 */
export function bindTxControls(onChange) {
  elements.search.addEventListener("input", onChange);
  elements.filterType.addEventListener("change", onChange);
  elements.filterCategory.addEventListener("change", onChange);
  elements.filterMonth.addEventListener("change", onChange);
}

/**
 * Bind the load-more button.
 * @param {() => void} onLoadMore
 */
export function bindLoadMore(onLoadMore) {
  elements.loadMore.addEventListener("click", onLoadMore);
}

/**
 * Attach delegated edit/delete handling to the transaction table body.
 * @param {{onDelete:(id:string)=>void, onEdit:(id:string)=>void}} handlers
 */
export function bindTableActions({ onDelete, onEdit }) {
  elements.tbody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const row = event.target.closest("tr");
    const id = row?.dataset.id;
    if (!id) return;
    if (button.dataset.action === "delete") onDelete(id);
    else if (button.dataset.action === "edit") onEdit(id);
  });
}

/**
 * Render the most recent transactions on the dashboard (read-only).
 * @param {Array} transactions
 * @param {number} [limit]
 */
export function renderRecent(transactions, limit = 5) {
  elements.recentList.innerHTML = "";
  const recent = [...transactions].reverse().slice(0, limit);

  elements.recentEmpty.style.display = recent.length ? "none" : "block";
  recent.forEach((t) => {
    elements.recentList.appendChild(createTransactionItem(t, false));
  });
}

/* ============================ Dashboard stats ============================ */

/**
 * Format a percentage-change value into a labelled string with direction.
 * @param {number|null} value
 * @param {boolean} [invert] - for expenses, a rise is "bad" (down is good)
 * @returns {{text:string, cls:string}}
 */
function formatChange(value, invert = false) {
  if (value === null || Number.isNaN(value)) {
    return { text: "no prior month", cls: "stat-card__change--muted" };
  }
  const rounded = Math.round(value * 10) / 10;
  const up = rounded >= 0;
  const arrow = up ? "▲" : "▼";
  const positive = invert ? !up : up;
  const cls = positive ? "stat-card__change--up" : "stat-card__change--down";
  return {
    text: `${arrow} ${Math.abs(rounded)}% from last month`,
    cls,
  };
}

/**
 * Render the four dashboard stat cards.
 * @param {object} stats - from state.getDashboardStats()
 */
export function renderDashboardStats(stats) {
  elements.statBalance.textContent = formatCurrency(stats.balance);
  elements.statIncome.textContent = formatCurrency(stats.income);
  elements.statExpense.textContent = formatCurrency(stats.expense);
  elements.statCount.textContent = String(stats.count);

  const b = formatChange(stats.change.balance);
  const i = formatChange(stats.change.income);
  const e = formatChange(stats.change.expense, true);

  applyChange(elements.changeBalance, b);
  applyChange(elements.changeIncome, i);
  applyChange(elements.changeExpense, e);
}

function applyChange(el, { text, cls }) {
  el.textContent = text;
  el.className = `stat-card__change ${cls}`;
}

/* ============================ Charts ============================ */

/**
 * Render a horizontal bar chart of category totals into a container.
 * Pure CSS bars, no external library.
 * @param {HTMLElement} container
 * @param {HTMLElement} emptyEl
 * @param {Array<{category:string, total:number}>} data
 */
export function renderBars(container, emptyEl, data) {
  const hasData = data.length > 0;
  container.style.display = hasData ? "flex" : "none";
  if (emptyEl) emptyEl.style.display = hasData ? "none" : "block";
  if (!hasData) {
    container.innerHTML = "";
    return;
  }

  const max = Math.max(...data.map((d) => d.total));
  const grandTotal = data.reduce((sum, d) => sum + d.total, 0);

  container.innerHTML = data
    .map((d) => {
      const widthPct = max > 0 ? (d.total / max) * 100 : 0;
      const sharePct = grandTotal > 0 ? Math.round((d.total / grandTotal) * 100) : 0;
      return `
        <div class="chart__row">
          <div class="chart__meta">
            <span class="chart__category">${d.category}</span>
            <span class="chart__amount">${formatCurrency(d.total)} (${sharePct}%)</span>
          </div>
          <div class="chart__track">
            <div class="chart__bar" style="width: ${widthPct}%"></div>
          </div>
        </div>`;
    })
    .join("");
}

/* ============================ Donut chart ============================ */

// A fixed, professional palette. Categories map to colours by their order so
// the same category keeps the same colour across renders.
const DONUT_COLORS = [
  "#2563eb", // blue
  "#f97316", // orange
  "#16a34a", // green
  "#9333ea", // purple
  "#e11d48", // rose
  "#0891b2", // cyan
  "#ca8a04", // amber
  "#64748b", // slate
];

/**
 * Render an expense breakdown donut chart (pure SVG) with a legend.
 * Total expenses are shown in the centre.
 * @param {Array<{category:string, total:number}>} data
 */
export function renderDonut(data) {
  const hasData = data.length > 0;
  elements.donut.style.display = hasData ? "grid" : "none";
  if (elements.donutEmpty) elements.donutEmpty.style.display = hasData ? "none" : "block";
  if (!hasData) {
    elements.donut.innerHTML = "";
    return;
  }

  const total = data.reduce((sum, d) => sum + d.total, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Build the coloured arcs using stroke-dasharray/offset.
  let offset = 0;
  const segments = data
    .map((d, i) => {
      const fraction = total > 0 ? d.total / total : 0;
      const length = fraction * circumference;
      const color = DONUT_COLORS[i % DONUT_COLORS.length];
      const circle = `
        <circle
          class="donut__segment"
          cx="80" cy="80" r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="22"
          stroke-dasharray="${length} ${circumference - length}"
          stroke-dashoffset="${-offset}"
        ></circle>`;
      offset += length;
      return circle;
    })
    .join("");

  // Legend rows: colour dot, category, amount and percentage.
  const legend = data
    .map((d, i) => {
      const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
      const color = DONUT_COLORS[i % DONUT_COLORS.length];
      return `
        <li class="donut__legend-item">
          <span class="donut__dot" style="background:${color}"></span>
          <span class="donut__legend-name">${d.category}</span>
          <span class="donut__legend-value">${formatCurrency(d.total)} <span class="donut__legend-pct">${pct}%</span></span>
        </li>`;
    })
    .join("");

  elements.donut.innerHTML = `
    <div class="donut__chart">
      <svg viewBox="0 0 160 160" class="donut__svg" role="img" aria-label="Expenses by category">
        <g transform="rotate(-90 80 80)">${segments}</g>
      </svg>
      <div class="donut__center">
        <span class="donut__center-label">Total Expenses</span>
        <span class="donut__center-value">${formatCurrency(total)}</span>
      </div>
    </div>
    <ul class="donut__legend">${legend}</ul>
  `;
  console.log(`[ui] Rendered donut with ${data.length} segment(s), total ${total}`);
}

/**
 * Attach a change listener to the donut "This Month / All Time" scope.
 * @param {() => void} onChange
 */
export function bindDonutScope(onChange) {
  elements.donutScope?.addEventListener("change", onChange);
}

/**
 * Read the current donut scope value ("month" or "all").
 * @returns {string}
 */
export function getDonutScope() {
  return elements.donutScope?.value || "all";
}

/* ============================ Reports (monthly) ============================ */

export function populateMonths(months) {
  const previous = elements.monthSelect.value;
  elements.monthSelect.innerHTML = months
    .map((m) => `<option value="${m}">${formatMonthLabel(m)}</option>`)
    .join("");
  if (months.includes(previous)) elements.monthSelect.value = previous;
}

export function getSelectedMonth() {
  return elements.monthSelect.value || null;
}

export function renderMonthlySummary(summary) {
  const hasData = summary !== null;
  const totals = document.querySelector(".monthly__totals");
  elements.monthSelect.style.display = hasData ? "" : "none";
  if (totals) totals.style.display = hasData ? "grid" : "none";
  elements.monthlyEmpty.style.display = hasData ? "none" : "block";
  if (!hasData) return;

  elements.monthIncome.textContent = formatCurrency(summary.income);
  elements.monthExpense.textContent = formatCurrency(summary.expense);
  elements.monthNet.textContent = formatCurrency(summary.balance);
}

export function bindMonthChange(onChange) {
  elements.monthSelect.addEventListener("change", onChange);
}

/* ============================ Form ============================ */

export function populateCategoryOptions(type, selected) {
  const categories = CATEGORIES[type] || [];
  elements.category.innerHTML =
    `<option value="">Select category</option>` +
    categories.map((c) => `<option value="${c}">${c}</option>`).join("");
  if (selected && categories.includes(selected)) {
    elements.category.value = selected;
  }
}

export function populateFilterCategories() {
  elements.filterCategory.innerHTML =
    `<option value="all">All categories</option>` +
    ALL_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
}

/**
 * Wire the Income/Expense tabs. Switching a tab sets the hidden type input
 * and repopulates the category options.
 * @param {() => void} [onChange]
 */
export function bindTypeTabs(onChange) {
  elements.typeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      elements.typeTabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      elements.type.value = tab.dataset.type;
      populateCategoryOptions(tab.dataset.type);
      if (onChange) onChange();
    });
  });
}

/**
 * Programmatically select a type tab (used when editing).
 * @param {string} type
 */
export function setActiveTypeTab(type) {
  elements.typeTabs.forEach((t) =>
    t.classList.toggle("is-active", t.dataset.type === type)
  );
  elements.type.value = type;
}

export function readForm() {
  return {
    type: elements.type.value,
    amount: elements.amount.value.trim(),
    category: elements.category.value,
    date: elements.date.value,
    description: elements.description.value.trim(),
  };
}

export function resetForm() {
  elements.form.reset();
  setActiveTypeTab("expense");
  populateCategoryOptions("expense");
  elements.submitButton.textContent = "Add Transaction";
  elements.cancelButton.hidden = true;
  setDateToToday();
  clearErrors();
}

export function setDateToToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  elements.date.value = `${yyyy}-${mm}-${dd}`;
}

export function bindCancelEdit(onCancel) {
  elements.cancelButton.addEventListener("click", onCancel);
}

export function fillForm(transaction) {
  setActiveTypeTab(transaction.type);
  populateCategoryOptions(transaction.type, transaction.category);
  elements.amount.value = transaction.amount;
  elements.date.value = transaction.date;
  elements.description.value = transaction.description;
  elements.submitButton.textContent = "Update Transaction";
  elements.cancelButton.hidden = false;
}

/* ============================ Validation display ============================ */

export function showErrors(errors) {
  clearErrors();
  for (const [field, message] of Object.entries(errors)) {
    const slot = document.querySelector(`[data-error-for="${field}"]`);
    if (slot) slot.textContent = message;
    const input = elements[field];
    if (input) input.classList.add("input--invalid");
  }
  console.warn("[ui] Validation errors shown:", errors);
}

export function clearErrors() {
  document.querySelectorAll(".form__error").forEach((el) => (el.textContent = ""));
  ["amount", "category", "date", "description"].forEach((field) => {
    elements[field]?.classList.remove("input--invalid");
  });
}

/* ============================ Filters & list actions ============================ */

export function readFilters() {
  return {
    type: elements.filterType.value,
    category: elements.filterCategory.value,
    month: elements.filterMonth.value,
    search: getSearchText(),
  };
}
