// ui.js
// Responsible for reading from and writing to the DOM. It holds no business
// data, it only reflects state onto the page and reads user input.

import { getCategoryNames, getAllCategoryNames } from "./categories.js";

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
  pagination: document.getElementById("tx-pagination"),
  pageInfo: document.getElementById("tx-page-info"),
  prevBtn: document.getElementById("tx-prev"),
  nextBtn: document.getElementById("tx-next"),
  txStatCount: document.getElementById("tx-stat-count"),
  txStatIncome: document.getElementById("tx-stat-income"),
  txStatExpense: document.getElementById("tx-stat-expense"),
  txStatBalance: document.getElementById("tx-stat-balance"),

  // Dashboard view
  statBalance: document.getElementById("stat-balance"),
  statIncome: document.getElementById("stat-income"),
  statExpense: document.getElementById("stat-expense"),
  statCount: document.getElementById("stat-count"),
  donut: document.getElementById("donut"),
  donutEmpty: document.getElementById("donut-empty"),
  ovIncome: document.getElementById("ov-income"),
  ovExpense: document.getElementById("ov-expense"),
  ovIncomeBar: document.getElementById("ov-income-bar"),
  ovExpenseBar: document.getElementById("ov-expense-bar"),
  ovNet: document.getElementById("ov-net"),
  donutScope: document.getElementById("donut-scope"),

  // Categories view
  categoryCards: document.getElementById("category-cards"),
  categoryEmpty: document.getElementById("category-empty"),
  categoryCount: document.getElementById("category-count"),
  catSearch: document.getElementById("cat-search-input"),
  catTypeFilter: document.getElementById("cat-type-filter"),
  addCategoryBtn: document.getElementById("add-category-btn"),
  catPrev: document.getElementById("cat-prev"),
  catNext: document.getElementById("cat-next"),

  // Category modal
  modal: document.getElementById("category-modal"),
  modalTitle: document.getElementById("modal-title"),
  categoryForm: document.getElementById("category-form"),
  catId: document.getElementById("cat-id"),
  catName: document.getElementById("cat-name"),
  catType: document.getElementById("cat-type"),
  catDescription: document.getElementById("cat-description"),
  catIcon: document.getElementById("cat-icon"),
  catColor: document.getElementById("cat-color"),

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
 * Render one page of the filtered transactions as a table, with Prev/Next
 * pagination controls and a summary line.
 * @param {Array} transactions - already filtered
 * @param {number} page - current page (1-based)
 * @param {number} pageSize - rows per page
 * @param {{income:number, expense:number}} totals - totals of the filtered set
 * @returns {number} the (clamped) page actually shown
 */
export function renderTransactions(transactions, page, pageSize, totals) {
  const ordered = [...transactions].reverse(); // newest first
  const count = ordered.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  // Clamp the page in case filtering shrank the list.
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  const shown = ordered.slice(start, start + pageSize);

  elements.tbody.innerHTML = shown.map(createTransactionRow).join("");

  // Empty state.
  const anyData = count > 0;
  elements.emptyState.style.display = anyData ? "none" : "block";
  const filtersActive =
    elements.filterType.value !== "all" ||
    elements.filterCategory.value !== "all" ||
    elements.search.value.trim() !== "";
  elements.emptyState.textContent = filtersActive
    ? "No transactions match your search or filters."
    : "No transactions yet. Add one to get started.";

  // Pagination controls.
  elements.pagination.hidden = !anyData;
  if (anyData) {
    const from = start + 1;
    const to = start + shown.length;
    elements.pageInfo.textContent = `Showing ${from}–${to} of ${count}`;
    elements.prevBtn.disabled = current <= 1;
    elements.nextBtn.disabled = current >= totalPages;
  }

  // Summary line.
  elements.txSummary.textContent =
    `${count} transaction${count === 1 ? "" : "s"} · ` +
    `Income ${formatCurrency(totals.income)} · Expense ${formatCurrency(totals.expense)}`;

  console.log(`[ui] Rendered page ${current}/${totalPages} (${shown.length} of ${count})`);
  return current;
}

/**
 * Read the search text.
 * @returns {string}
 */
export function getSearchText() {
  return elements.search.value.trim().toLowerCase();
}

/**
 * Bind search, type, category and date filter changes.
 * @param {() => void} onChange
 */
export function bindTxControls(onChange) {
  elements.search.addEventListener("input", onChange);
  elements.filterType.addEventListener("change", onChange);
  elements.filterCategory.addEventListener("change", onChange);
}

/**
 * Bind the Previous / Next pagination buttons.
 * @param {{onPrev:()=>void, onNext:()=>void}} handlers
 */
export function bindPagination({ onPrev, onNext }) {
  elements.prevBtn.addEventListener("click", onPrev);
  elements.nextBtn.addEventListener("click", onNext);
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
 * Render the four dashboard stat cards for the selected period.
 * @param {{balance:number, income:number, expense:number, count:number}} stats
 */
export function renderDashboardStats(stats) {
  elements.statBalance.textContent = formatCurrency(stats.balance);
  elements.statIncome.textContent = formatCurrency(stats.income);
  elements.statExpense.textContent = formatCurrency(stats.expense);
  elements.statCount.textContent = String(stats.count);
}

/**
 * Render the Expense Overview insights: income vs expense bars and net saved.
 * Bars are sized relative to the larger of income/expense.
 * @param {{income:number, expense:number, balance:number}} stats
 */
export function renderOverviewInsights(stats) {
  elements.ovIncome.textContent = formatCurrency(stats.income);
  elements.ovExpense.textContent = formatCurrency(stats.expense);
  elements.ovNet.textContent = formatCurrency(stats.balance);

  const max = Math.max(stats.income, stats.expense, 1);
  elements.ovIncomeBar.style.width = `${(stats.income / max) * 100}%`;
  elements.ovExpenseBar.style.width = `${(stats.expense / max) * 100}%`;

  // Net colour: green if positive, red if negative.
  elements.ovNet.style.color =
    stats.balance >= 0 ? "var(--income)" : "var(--expense)";
}

/**
 * Populate the dashboard period dropdown (All Time + each available month).
 * @param {string[]} months - "YYYY-MM" list, newest first
 */
/** Read the global month filter ("all" or a month number "01"–"12"). */
export function getGlobalMonth() {
  return document.getElementById("global-month").value || "all";
}

/** Bind the global month dropdown. */
export function bindGlobalMonth(onChange) {
  document.getElementById("global-month").addEventListener("change", onChange);
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
  const names = getCategoryNames(type);
  elements.category.innerHTML =
    `<option value="">Select category</option>` +
    names.map((c) => `<option value="${c}">${c}</option>`).join("");
  if (selected && names.includes(selected)) {
    elements.category.value = selected;
  }
}

export function populateFilterCategories() {
  const previous = elements.filterCategory.value;
  elements.filterCategory.innerHTML =
    `<option value="all">All categories</option>` +
    getAllCategoryNames().map((c) => `<option value="${c}">${c}</option>`).join("");
  if (previous) elements.filterCategory.value = previous;
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
    search: getSearchText(),
  };
}

/**
 * Render the stat cards at the top of the Transactions page.
 * Uses the same month-filtered totals as the table so they always match.
 * @param {{count:number, income:number, expense:number, balance:number}} stats
 */
export function renderTxStats(stats) {
  elements.txStatCount.textContent = String(stats.count);
  elements.txStatIncome.textContent = formatCurrency(stats.income);
  elements.txStatExpense.textContent = formatCurrency(stats.expense);
  elements.txStatBalance.textContent = formatCurrency(stats.balance);
}

/* ============================ Categories page ============================ */

/**
 * Render the category management table (one page), with search/type filtering
 * and pagination info.
 * @param {Array} categories - each with {id,name,type,description}
 * @param {(name:string) => {count:number,total:number}} statsFor
 * @param {number} [page] - current page (1-based)
 * @param {number} [pageSize] - rows per page
 * @returns {number} the (clamped) page actually shown
 */
export function renderCategoryCards(categories, statsFor, page = 1, pageSize = 8) {
  const search = elements.catSearch.value.trim().toLowerCase();
  const typeFilter = elements.catTypeFilter.value;

  const filtered = categories.filter((c) => {
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search) ||
      c.description.toLowerCase().includes(search);
    return matchesType && matchesSearch;
  });

  elements.categoryEmpty.style.display = filtered.length ? "none" : "block";

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  elements.categoryCards.innerHTML = pageItems
    .map((c) => {
      const { count, total } = statsFor(c.name);
      return `
        <tr data-id="${c.id}">
          <td data-label="Category">
            <div class="cat-cell__text">
              <span class="cat-cell__name">${c.name}</span>
              <span class="cat-cell__desc">${c.description || "No description"}</span>
            </div>
          </td>
          <td data-label="Transactions" class="cat-table__num">
            <span class="cat-cell__count">${count}</span>
            <span class="cat-cell__count-label">transactions</span>
          </td>
          <td data-label="Total Spent" class="cat-table__num cat-cell__total">${formatCurrency(total)}</td>
          <td data-label="Actions" class="cat-table__actions-col">
            <span class="cat-actions">
              <button type="button" class="cat-action cat-action--edit" data-action="edit" aria-label="Edit category">&#9998;</button>
              <button type="button" class="cat-action cat-action--delete" data-action="delete" aria-label="Delete category">&#128465;</button>
            </span>
          </td>
        </tr>`;
    })
    .join("");

  // Footer: "Showing 1 to 6 of 6 categories".
  const from = filtered.length ? start + 1 : 0;
  const to = start + pageItems.length;
  elements.categoryCount.textContent = filtered.length
    ? `Showing ${from} to ${to} of ${filtered.length} categories`
    : "";

  // Pagination buttons: active page number + prev/next enable state.
  const activeBtn = document.querySelector(".cat-page-btn--active");
  if (activeBtn) activeBtn.textContent = String(current);
  if (elements.catPrev) elements.catPrev.disabled = current <= 1;
  if (elements.catNext) elements.catNext.disabled = current >= totalPages;

  console.log(`[ui] Rendered category page ${current}/${totalPages} (${pageItems.length} of ${filtered.length})`);
  return current;
}

/**
 * Bind the category Previous / Next pagination buttons.
 * @param {{onPrev:()=>void, onNext:()=>void}} handlers
 */
export function bindCategoryPagination({ onPrev, onNext }) {
  elements.catPrev?.addEventListener("click", onPrev);
  elements.catNext?.addEventListener("click", onNext);
}

/**
 * Bind the category search and type filter.
 * @param {() => void} onChange
 */
export function bindCategoryControls(onChange) {
  elements.catSearch.addEventListener("input", onChange);
  elements.catTypeFilter.addEventListener("change", onChange);
}

/**
 * Delegate edit/delete clicks on the category cards.
 * @param {{onEdit:(id:string)=>void, onDelete:(id:string)=>void}} handlers
 */
export function bindCategoryCardActions({ onEdit, onDelete }) {
  elements.categoryCards.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const row = event.target.closest("[data-id]");
    const id = row?.dataset.id;
    if (!id) return;
    if (button.dataset.action === "edit") onEdit(id);
    else if (button.dataset.action === "delete") onDelete(id);
  });
}

/* ============================ Category modal ============================ */

/** Open the modal in "add" mode. */
export function openAddCategoryModal() {
  elements.categoryForm.reset();
  elements.catId.value = "";
  elements.catColor.value = "#2563eb";
  elements.modalTitle.textContent = "Add Category";
  clearCategoryError();
  elements.modal.hidden = false;
  elements.catName.focus();
}

/** Open the modal pre-filled for editing. */
export function openEditCategoryModal(category) {
  elements.categoryForm.reset();
  elements.catId.value = category.id;
  elements.catName.value = category.name;
  elements.catType.value = category.type;
  elements.catDescription.value = category.description;
  elements.catIcon.value = category.icon;
  elements.catColor.value = category.color;
  elements.modalTitle.textContent = "Edit Category";
  clearCategoryError();
  elements.modal.hidden = false;
  elements.catName.focus();
}

export function closeCategoryModal() {
  elements.modal.hidden = true;
}

export function readCategoryForm() {
  return {
    id: elements.catId.value || null,
    name: elements.catName.value.trim(),
    type: elements.catType.value,
    description: elements.catDescription.value.trim(),
    icon: elements.catIcon.value,
    color: elements.catColor.value,
  };
}

export function showCategoryError(message) {
  const slot = document.querySelector('[data-error-for="cat-name"]');
  if (slot) slot.textContent = message;
  elements.catName.classList.add("input--invalid");
}

export function clearCategoryError() {
  const slot = document.querySelector('[data-error-for="cat-name"]');
  if (slot) slot.textContent = "";
  elements.catName.classList.remove("input--invalid");
}

/**
 * Wire the modal: open button, close buttons/backdrop, form submit.
 * @param {{onOpen:()=>void, onSubmit:()=>void}} handlers
 */
export function bindCategoryModal({ onOpen, onSubmit }) {
  elements.addCategoryBtn.addEventListener("click", onOpen);

  elements.modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeCategoryModal);
  });

  elements.categoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit();
  });
}


