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
  bindFilters,
  bindTypeTabs,
  populateCategoryOptions,
  populateFilterCategories,
  renderTransactions,
  renderRecent,
  renderDashboardStats,
  renderBars,
  bindListActions,
  showErrors,
  clearErrors,
  populateMonths,
  getSelectedMonth,
  renderMonthlySummary,
  bindMonthChange,
  bindCancelEdit,
  setDateToToday,
} from "./ui.js";
import { validateTransaction } from "./validation.js";
import { initRouter, showView } from "./router.js";
import { initTheme, bindThemeToggle } from "./theme.js";

// Tracks which transaction is being edited. null means adding a new one.
let editingId = null;

/* ============================ Rendering ============================ */

function applyFilters(transactions) {
  const { type, category } = readFilters();
  return transactions.filter((t) => {
    const matchesType = type === "all" || t.type === type;
    const matchesCategory = category === "all" || t.category === category;
    return matchesType && matchesCategory;
  });
}

/** Re-render every view so the UI always reflects current data. */
function renderAll() {
  const all = getTransactions();

  // Dashboard
  renderDashboardStats(getDashboardStats());
  renderRecent(all);
  renderBars(
    elements.dashboardChart,
    elements.dashboardChartEmpty,
    getExpenseByCategory(null)
  );

  // Transactions
  renderTransactions(applyFilters(all));

  // Categories
  renderBars(elements.catExpense, elements.catExpenseEmpty, getTotalsByCategory("expense"));
  renderBars(elements.catIncome, elements.catIncomeEmpty, getTotalsByCategory("income"));

  // Reports
  renderReports();
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
  bindListActions({
    onDelete: handleDeleteTransaction,
    onEdit: handleEditTransaction,
  });
  bindFilters(renderAll);
  bindMonthChange(renderReports);

  initRouter();

  renderAll();
}

init();
