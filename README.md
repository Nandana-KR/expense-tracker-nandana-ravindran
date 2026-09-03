# Expense Tracker

A simple expense tracker web app I built using plain HTML, CSS, and JavaScript. You can add income and expense transactions, edit or delete them, filter and search, and see your totals. All data is saved in the browser using Local Storage, so it stays even after you refresh the page.

**Live demo:** https://expense-tracker-nandana-ravindran.vercel.app

## Features

- Add income or expense transactions with amount, category, date, and description
- Edit and delete transactions
- View total income, total expenses, and current balance
- Filter transactions by type or category, and search by description
- Data saved in browser Local Storage (persists after refresh)
- Works on desktop and mobile
- Monthly summary and a category-wise chart
- Manage your own categories
- Form validation with helpful error messages
- Light and dark mode

## How to Run

The app uses JavaScript modules, so it needs to be opened through a local server. Pick any one of these:

**Using VS Code Live Server**
1. Open the project folder in VS Code.
2. Install the "Live Server" extension.
3. Right-click `index.html` and select "Open with Live Server".

**Using Node.js**
```
npx serve
```
Then open the link it shows (like `http://localhost:3000`).

**Using Python**
```
python -m http.server 5500
```
Then open `http://localhost:5500` in your browser.

## Project Structure

```
├── index.html        # main page
├── css/
│   └── styles.css    # styles
└── js/
    ├── app.js        # main logic and event handling
    ├── state.js      # transaction data + logic
    ├── categories.js # category data
    ├── storage.js    # Local Storage helpers
    ├── validation.js # form validation
    ├── ui.js         # rendering to the page
    ├── router.js     # page switching
    └── theme.js      # dark mode
```

## Author

Nandana Ravindran
