// router.js
// A tiny client-side view switcher. Shows one ".view" section at a time based
// on which sidebar nav item is clicked. No page reloads, no external router.

const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const sidebar = document.querySelector(".sidebar");
const backdrop = document.getElementById("sidebar-backdrop");

/** Open the mobile drawer (show sidebar + backdrop). */
function openDrawer() {
  sidebar?.classList.add("is-open");
  if (backdrop) backdrop.hidden = false;
}

/** Close the mobile drawer (hide sidebar + backdrop). */
function closeDrawer() {
  sidebar?.classList.remove("is-open");
  if (backdrop) backdrop.hidden = true;
}

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

  // Close the mobile drawer after navigating.
  closeDrawer();

  console.log(`[router] Switched to "${name}" view`);
  if (onChange) onChange(name);
}

/**
 * Wire up the sidebar nav, the mobile menu toggle, and the backdrop.
 * @param {(name:string) => void} onChange - called whenever the view changes
 */
export function initRouter(onChange) {
  navItems.forEach((item) => {
    item.addEventListener("click", () => showView(item.dataset.view, onChange));
  });

  const toggle = document.getElementById("sidebar-toggle");
  toggle?.addEventListener("click", () => {
    if (sidebar?.classList.contains("is-open")) closeDrawer();
    else openDrawer();
  });

  // Clicking the backdrop closes the drawer.
  backdrop?.addEventListener("click", closeDrawer);
}
