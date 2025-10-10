const API_BASE = "http://localhost/unilib/api";
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
  const title = document.getElementById("bookTitle").value;
  const author = document.getElementById("bookAuthor").value;
  const isbn = document.getElementById("bookIsbn").value;
  const published_year = document.getElementById("bookYear").value;
  const copies = document.getElementById("bookCopies").value || 1;

  const res = await fetch(`${API_BASE}/books.php?action=add`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ title, author, isbn, published_year, copies })
  });
  const data = await res.json();
  alert(data.message);
  listBooks();
}

async function listBooks() {
  const res = await fetch(`${API_BASE}/books.php?action=list`);
  const data = await res.json();
  renderTable("booksList", data.books || [], ["id", "title", "author", "isbn", "copies"]);
}

// ==================== LOANS ====================
async function borrowBook() {
  const user_id = document.getElementById("loanUserId").value;
  const book_id = document.getElementById("loanBookId").value;

  const res = await fetch(`${API_BASE}/loans.php?action=borrow`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ user_id, book_id })
  });
  const data = await res.json();
  alert(data.message);
  listLoans();
}

async function returnBook() {
  const loan_id = document.getElementById("returnLoanId").value;

  const res = await fetch(`${API_BASE}/loans.php?action=return`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ loan_id })
  });
  const data = await res.json();
  alert(data.message);
  listLoans();
}

async function listLoans() {
  const res = await fetch(`${API_BASE}/loans.php?action=list_all`);
  const data = await res.json();
  renderTable("loansList", data.loans || [], ["id", "user_id", "book_id", "loan_date", "due_date", "returned"]);
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

  fields.forEach(field => {
    const th = document.createElement("th");
    th.innerText = field.toUpperCase();
    header.appendChild(th);
  });
  table.appendChild(header);

  items.forEach(item => {
    const row = document.createElement("tr");
    fields.forEach(field => {
      const td = document.createElement("td");
      td.innerText = item[field] ?? "-";
      row.appendChild(td);
    });
    table.appendChild(row);
  });

  container.appendChild(table);
}
