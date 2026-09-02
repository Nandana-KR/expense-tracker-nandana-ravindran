// validation.js
// Pure validation logic. Given the raw form values, it returns an object of
// error messages keyed by field name. An empty object means the form is valid.
// Keeping this separate makes the rules easy to read and change.

/**
 * Validate the transaction form values.
 * @param {{type:string, amount:string, category:string, date:string, description:string}} data
 * @returns {Record<string, string>} field -> error message (empty if valid)
 */
export function validateTransaction(data) {
  const errors = {};

  // Amount: required, must be a number greater than zero.
  if (data.amount === "") {
    errors.amount = "Please enter an amount.";
  } else {
    const amount = Number(data.amount);
    if (Number.isNaN(amount)) {
      errors.amount = "Amount must be a valid number.";
    } else if (amount <= 0) {
      errors.amount = "Amount must be greater than zero.";
    }
  }

  // Category: required.
  if (!data.category) {
    errors.category = "Please choose a category.";
  }

  // Date: required, and not in the future.
  if (!data.date) {
    errors.date = "Please select a date.";
  } else {
    const selected = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) {
      errors.date = "Date cannot be in the future.";
    }
  }

  // Description: required.
  if (!data.description) {
    errors.description = "Please add a short description.";
  }

  return errors;
}
