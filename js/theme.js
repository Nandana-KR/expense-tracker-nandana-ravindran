// theme.js
// Handles light/dark theme switching and remembers the choice in localStorage.

const THEME_KEY = "expense-tracker:theme";

/**
 * Apply a theme by toggling a class on the document root.
 * @param {"light"|"dark"} theme
 */
function applyTheme(theme) {
  document.documentElement.classList.toggle("theme-dark", theme === "dark");
  const label = document.querySelector(".theme-toggle__label");
  const icon = document.querySelector(".theme-toggle__icon");
  if (label) label.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  if (icon) icon.textContent = theme === "dark" ? "☀" : "☾";
}

/**
 * Load the saved theme (defaults to light) and apply it.
 */
export function initTheme() {
  let theme = "light";
  try {
    theme = localStorage.getItem(THEME_KEY) || "light";
  } catch (error) {
    console.error("[theme] Could not read saved theme:", error);
  }
  applyTheme(theme);
  console.log(`[theme] Applied "${theme}" theme`);
}

/**
 * Wire the toggle button to flip and persist the theme.
 */
export function bindThemeToggle() {
  const button = document.getElementById("theme-toggle");
  button?.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("theme-dark");
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (error) {
      console.error("[theme] Could not save theme:", error);
    }
    console.log(`[theme] Switched to "${next}"`);
  });
}
