// app.js
// Entry point. Wires modules together, handles navigation, and renders views.

import {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction,
  getAvailableMonths,
  getMonthlySummary,
  getExpenseByCategory,
  countTransactionsInCategory,
} from "./state.js";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  categoryNameExists,
} from "./categories.js";
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
  renderDashboardStats,
  renderOverviewInsights,
  renderTxStats,
  renderBars,
  renderDonut,
  getGlobalMonth,
  bindGlobalMonth,
  showErrors,
  clearErrors,
  populateMonths,
  getSelectedMonth,
  renderMonthlySummary,
  bindMonthChange,
  bindCancelEdit,
  setDateToToday,
  bindTxControls,
  bindPagination,
  bindTableActions,
  renderCategoryCards,
  bindCategoryControls,
  bindCategoryCardActions,
  bindCategoryPagination,
  bindCategoryModal,
  openAddCategoryModal,
  openEditCategoryModal,
  closeCategoryModal,
  readCategoryForm,
  showCategoryError,
} from "./ui.js";
import { validateTransaction } from "./validation.js";
import { initRouter, showView } from "./router.js";
import { initTheme, bindThemeToggle } from "./theme.js";

// Tracks which transaction is being edited. null means adding a new one.
let editingId = null;

// Transactions table pagination: show 5 per page with Prev/Next.
const PAGE_SIZE = 5;
let currentPage = 1;

// Categories table pagination.
const CATEGORY_PAGE_SIZE = 8;
let categoryPage = 1;

/* ============================ Rendering ============================ */

/**
 * True if a transaction matches the global month filter (any year).
 * @param {object} t
 * @returns {boolean}
 */
function matchesGlobalMonth(t) {
  const month = getGlobalMonth();
  if (month === "all") return true;
  return t.date && t.date.slice(5, 7) === month;
}

/** All transactions within the global month filter. */
function rangedTransactions() {
  return getTransactions().filter(matchesGlobalMonth);
}

/** Summarise a list into income/expense/balance/count. */
function summarise(list) {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
  }
  return { income, expense, balance: income - expense, count: list.length };
}

/** Expenses grouped by category for a list, sorted high to low. */
function expensesByCategory(list) {
  const totals = {};
  for (const t of list) {
    if (t.type !== "expense") continue;
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }
  return Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function applyFilters(transactions) {
  const { type, category, search } = readFilters();
  return transactions.filter((t) => {
    const matchesType = type === "all" || t.type === type;
    const matchesCategory = category === "all" || t.category === category;
    const haystack = `${t.description} ${t.category}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    return matchesType && matchesCategory && matchesSearch;
  });
}

/** Render the current page of the transactions table (range + filters). */
function renderTable() {
  const filtered = applyFilters(rangedTransactions());
  const totals = summarise(filtered);
  currentPage = renderTransactions(filtered, currentPage, PAGE_SIZE, totals);
}

/** Re-render every view so the UI always reflects current data + range. */
function renderAll() {
  const ranged = rangedTransactions();

  // Dashboard: stats + donut + insights scoped to the global month.
  const monthStats = summarise(ranged);
  renderDashboardStats(monthStats);
  renderDonut(expensesByCategory(ranged));
  renderOverviewInsights(monthStats);

  // Transactions
  renderTxStats(summarise(ranged));
  renderTable();

  // Categories (counts/totals within range)
  categoryPage = renderCategoryCards(
    getCategories(),
    categoryStatsInRange,
    categoryPage,
    CATEGORY_PAGE_SIZE
  );

  // Reports
  renderReports();
}

/** Per-category stats limited to the current date range. */
function categoryStatsInRange(categoryName) {
  let count = 0;
  let total = 0;
  for (const t of rangedTransactions()) {
    if (t.category === categoryName) {
      count += 1;
      total += t.amount;
    }
  }
  return { count, total };
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
  showView("dashboard"); // the add/edit form now lives on the dashboard
}

function handleCancelEdit() {
  editingId = null;
  resetForm();
  showView("dashboard");
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

/* ---- Category handlers ---- */

function handleCategorySubmit() {
  const data = readCategoryForm();

  if (!data.name) {
    showCategoryError("Please enter a category name.");
    return;
  }
  if (categoryNameExists(data.name, data.id)) {
    showCategoryError("A category with this name already exists.");
    return;
  }

  if (data.id) {
    updateCategory(data.id, {
      name: data.name,
      type: data.type,
      description: data.description,
      icon: data.icon,
      color: data.color,
    });
  } else {
    addCategory(data);
  }

  closeCategoryModal();
  // Refresh the dropdowns that depend on categories, then re-render.
  populateCategoryOptions(elements.type.value);
  populateFilterCategories();
  renderAll();
}

function handleEditCategory(id) {
  const category = getCategories().find((c) => c.id === id);
  if (!category) return;
  openEditCategoryModal(category);
}

function handleDeleteCategory(id) {
  const category = getCategories().find((c) => c.id === id);
  if (!category) return;

  // Guard: warn if the category is in use by transactions.
  const inUse = countTransactionsInCategory(category.name);
  const message = inUse
    ? `"${category.name}" is used by ${inUse} transaction(s). Delete the category anyway? Those transactions will keep their label.`
    : `Delete the "${category.name}" category?`;
  if (!window.confirm(message)) return;

  deleteCategory(id);
  populateCategoryOptions(elements.type.value);
  populateFilterCategories();
  renderAll();
}

/* ---- Settings handlers ---- */

function handleClearData() {
  const confirmed = window.confirm(
    "This will permanently delete ALL transactions from this browser. Continue?"
  );
  if (!confirmed) return;
  getTransactions().forEach((t) => deleteTransaction(t.id));
  renderAll();
  console.log("[app] All transactions cleared");
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
  // Any filter/search change resets to page 1 and re-renders the table.
  bindTxControls(() => {
    currentPage = 1;
    renderTable();
  });
  bindPagination({
    onPrev: () => {
      currentPage -= 1;
      renderTable();
    },
    onNext: () => {
      currentPage += 1;
      renderTable();
    },
  });
  bindMonthChange(renderReports);

  // Default the global month to the current month, then bind it.
  document.getElementById("global-month").value = String(
    new Date().getMonth() + 1
  ).padStart(2, "0");
  bindGlobalMonth(renderAll);

  // Categories page + modal
  const renderCats = () => {
    categoryPage = renderCategoryCards(
      getCategories(),
      categoryStatsInRange,
      categoryPage,
      CATEGORY_PAGE_SIZE
    );
  };
  bindCategoryControls(() => {
    categoryPage = 1;
    renderCats();
  });
  bindCategoryPagination({
    onPrev: () => {
      categoryPage -= 1;
      renderCats();
    },
    onNext: () => {
      categoryPage += 1;
      renderCats();
    },
  });
  bindCategoryCardActions({
    onEdit: handleEditCategory,
    onDelete: handleDeleteCategory,
  });
  bindCategoryModal({
    onOpen: openAddCategoryModal,
    onSubmit: handleCategorySubmit,
  });

  // Settings actions
  document.getElementById("settings-theme")?.addEventListener("click", () => {
    document.getElementById("theme-toggle")?.click();
  });
  document.getElementById("clear-data")?.addEventListener("click", handleClearData);

  initRouter();

  renderAll();
}

init();
