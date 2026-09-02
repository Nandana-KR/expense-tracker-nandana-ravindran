// app.js
// Entry point. Wires modules together, handles navigation, and renders views.

import {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction,
  getDashboardStats,
  getAvailableMonths,
  getMonthlySummary,
  getExpenseByCategory,
  getTotalsByCategory,
} from "./state.js";
import {
  elements,
  readForm,
  resetForm,
  fillForm,
  readFilters,
  bindTypeTabs,
  populateCategoryOptions,
  populateFilterCategories,
  renderTransactions,
  renderRecent,
  renderDashboardStats,
  renderBars,
  renderDonut,
  bindDonutScope,
  getDonutScope,
  showErrors,
  clearErrors,
  populateMonths,
  populateMonthFilter,
  getSelectedMonth,
  renderMonthlySummary,
  bindMonthChange,
  bindCancelEdit,
  setDateToToday,
  bindTxControls,
  bindLoadMore,
  bindTableActions,
} from "./ui.js";
import { validateTransaction } from "./validation.js";
import { initRouter, showView } from "./router.js";
import { initTheme, bindThemeToggle } from "./theme.js";

// Tracks which transaction is being edited. null means adding a new one.
let editingId = null;

// How many transactions are shown in the table (for load-more pagination).
const PAGE_SIZE = 10;
let visibleCount = PAGE_SIZE;

/* ============================ Rendering ============================ */

function applyFilters(transactions) {
  const { type, category, month, search } = readFilters();
  return transactions.filter((t) => {
    const matchesType = type === "all" || t.type === type;
    const matchesCategory = category === "all" || t.category === category;
    const matchesMonth = month === "all" || (t.date && t.date.slice(0, 7) === month);
    const haystack = `${t.description} ${t.category}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    return matchesType && matchesCategory && matchesMonth && matchesSearch;
  });
}

/** Render just the transactions table (used on filter/search/load-more). */
function renderTable() {
  const filtered = applyFilters(getTransactions());
  const totals = filtered.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  renderTransactions(filtered, visibleCount, totals);
}

/** Re-render every view so the UI always reflects current data. */
function renderAll() {
  const all = getTransactions();

  // Dashboard
  renderDashboardStats(getDashboardStats());
  renderRecent(all);
  renderDonutChart();

  // Transactions
  populateMonthFilter(getAvailableMonths());
  renderTable();

  // Categories
  renderBars(elements.catExpense, elements.catExpenseEmpty, getTotalsByCategory("expense"));
  renderBars(elements.catIncome, elements.catIncomeEmpty, getTotalsByCategory("income"));

  // Reports
  renderReports();
}

/** Current month as "YYYY-MM". */
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Render the dashboard donut based on the selected scope (this month / all time). */
function renderDonutChart() {
  const scope = getDonutScope();
  const month = scope === "month" ? currentMonth() : null;
  renderDonut(getExpenseByCategory(month));
}

function renderReports() {
  populateMonths(getAvailableMonths());
  const selected = getSelectedMonth();
  if (!selected) {
    renderMonthlySummary(null);
    renderBars(elements.chartBars, elements.chartEmpty, []);
    return;
  }
  renderMonthlySummary(getMonthlySummary(selected));
  renderBars(elements.chartBars, elements.chartEmpty, getExpenseByCategory(selected));
}

/* ============================ Handlers ============================ */

function handleSubmit(event) {
  event.preventDefault();
  const data = readForm();

  const errors = validateTransaction(data);
  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    return;
  }
  clearErrors();

  if (editingId) {
    updateTransaction(editingId, data);
    editingId = null;
  } else {
    addTransaction(data);
  }

  resetForm();
  renderAll();
  showView("transactions"); // jump to the list so the user sees the result
}

function handleEditTransaction(id) {
  const transaction = getTransactions().find((t) => t.id === id);
  if (!transaction) {
    console.warn("[app] Cannot edit, transaction not found:", id);
    return;
  }
  editingId = id;
  fillForm(transaction);
  showView("add");
}

function handleCancelEdit() {
  editingId = null;
  resetForm();
  showView("transactions");
}

function handleDeleteTransaction(id) {
  if (!window.confirm("Delete this transaction?")) return;
  deleteTransaction(id);
  if (editingId === id) {
    editingId = null;
    resetForm();
  }
  renderAll();
}

/* ============================ Init ============================ */

function init() {
  console.log("[ExpenseTracker] App initialised");

  initTheme();
  bindThemeToggle();

  populateCategoryOptions("expense");
  populateFilterCategories();
  setDateToToday();

  elements.form.addEventListener("submit", handleSubmit);
  elements.form.addEventListener("input", clearErrors);
  bindTypeTabs();
  bindCancelEdit(handleCancelEdit);
  bindTableActions({
    onDelete: handleDeleteTransaction,
    onEdit: handleEditTransaction,
  });
  // Any filter/search change resets pagination and re-renders the table.
  bindTxControls(() => {
    visibleCount = PAGE_SIZE;
    renderTable();
  });
  bindLoadMore(() => {
    visibleCount += PAGE_SIZE;
    renderTable();
  });
  bindMonthChange(renderReports);
  bindDonutScope(renderDonutChart);

  initRouter();

  renderAll();
}

init();
