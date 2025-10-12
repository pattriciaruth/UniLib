const API_BASE = window.location.origin + "/api";

const user = JSON.parse(localStorage.getItem("user"));

// Redirect if not logged in or wrong role
if (!user || user.role !== "librarian") {
  alert("Access denied. Please login as a librarian.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("welcomeMessage").innerText = `Welcome, ${user.name}!`;
  listBooks();
  listLoans();
});

// ==================== LOGOUT ====================
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ==================== BOOKS ====================
async function addBook() {
  const title = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const isbn = document.getElementById("bookIsbn").value.trim();
  const published_year = document.getElementById("bookYear").value.trim();
  const copies = parseInt(document.getElementById("bookCopies").value) || 1;

  if (!title || !author || !isbn) {
    alert("Please fill in Title, Author, and ISBN.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/books.php?action=add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, isbn, published_year, copies }),
    });

    const data = await res.json();
    alert(data.message || "Book added successfully.");
    listBooks();
  } catch (err) {
    alert("Error adding book: " + err.message);
  }
}

async function listBooks() {
  try {
    const res = await fetch(`${API_BASE}/books.php?action=list`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderTable("booksList", data.data || [], ["id", "title", "author", "isbn", "copies"]);
  } catch (err) {
    document.getElementById("booksList").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ==================== LOANS ====================
async function borrowBook() {
  const user_id = document.getElementById("loanUserId").value;
  const book_id = document.getElementById("loanBookId").value;

  // default due date = 14 days later
  const due_date = new Date();
  due_date.setDate(due_date.getDate() + 14);
  const formattedDueDate = due_date.toISOString().split("T")[0];

  if (!user_id || !book_id) {
    alert("Please provide both User ID and Book ID.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/loans.php?action=borrow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, book_id, due_date: formattedDueDate }),
    });
    const data = await res.json();
    alert(data.message || "Book borrowed successfully.");
    listLoans();
  } catch (err) {
    alert("Error borrowing book: " + err.message);
  }
}

async function returnBook() {
  const loan_id = document.getElementById("returnLoanId").value;

  if (!loan_id) {
    alert("Please enter the Loan ID to return.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/loans.php?action=return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loan_id }),
    });
    const data = await res.json();
    alert(data.message || "Book returned successfully.");
    listLoans();
  } catch (err) {
    alert("Error returning book: " + err.message);
  }
}

async function listLoans() {
  try {
    const res = await fetch(`${API_BASE}/loans.php?action=list`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderTable("loansList", data.data || [], [
      "id",
      "user_id",
      "book_id",
      "loan_date",
      "due_date",
      "returned",
    ]);
  } catch (err) {
    document.getElementById("loansList").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ==================== HELPER: TABLE RENDER ====================
function renderTable(containerId, items, fields) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = "<p>No records found.</p>";
    return;
  }

  const table = document.createElement("table");
  table.border = "1";
  const header = document.createElement("tr");

  fields.forEach((field) => {
    const th = document.createElement("th");
    th.innerText = field.toUpperCase();
    header.appendChild(th);
  });
  table.appendChild(header);

  items.forEach((item) => {
    const row = document.createElement("tr");
    fields.forEach((field) => {
      const td = document.createElement("td");
      td.innerText = item[field] ?? "-";
      row.appendChild(td);
    });
    table.appendChild(row);
  });

  container.appendChild(table);
}
