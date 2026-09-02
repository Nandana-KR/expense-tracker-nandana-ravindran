// router.js
// A tiny client-side view switcher. Shows one ".view" section at a time based
// on which sidebar nav item is clicked. No page reloads, no external router.

const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const sidebar = document.querySelector(".sidebar");

/**
 * Show the view with the given name and highlight its nav item.
 * @param {string} name
 * @param {(name:string) => void} [onChange] - called after switching
 */
export function showView(name, onChange) {
  views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === name);
  });
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === name);
  });

  // Close the mobile sidebar after navigating.
  sidebar?.classList.remove("is-open");

  console.log(`[router] Switched to "${name}" view`);
  if (onChange) onChange(name);
}

/**
 * Wire up the sidebar nav and the mobile menu toggle.
 * @param {(name:string) => void} onChange - called whenever the view changes
 */
export function initRouter(onChange) {
  navItems.forEach((item) => {
    item.addEventListener("click", () => showView(item.dataset.view, onChange));
  });

  const toggle = document.getElementById("sidebar-toggle");
  toggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("is-open");
  });
}
