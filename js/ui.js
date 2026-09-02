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
};

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
