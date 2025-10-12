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
  const subject = document.getElementById("bookSubject")?.value.trim() || "";
  const isbn = document.getElementById("bookIsbn").value.trim();
  const published_year = document.getElementById("bookYear").value.trim();
  const copies = document.getElementById("bookCopies").value.trim() || 1;

  if (!title) {
    alert("Book title is required!");
    return;
  }

  const res = await fetch(`${API_BASE}/books.php?action=add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, author, subject, isbn, published_year, copies })
  });
  const data = await res.json();
  alert(data.message || "Done");
  listBooks();
}

async function listBooks() {
  const res = await fetch(`${API_BASE}/books.php?action=list`);
  const data = await res.json();
  // Expect { status: "success", books: [...] }
  const rows = data.books || data.data || [];
  renderTable("booksList", rows, [
    "id", "title", "author", "subject", "isbn", "copies", "created_at"
  ]);
}

// ==================== USERS ====================
async function listUsers() {
  const box = document.getElementById("usersList");
  box.innerHTML = "Loading...";
  try {
    const res = await fetch(`${API_BASE}/users.php?action=list`);
    const data = await res.json();
    // Expect { status: "success", users: [...] }
    const rows = data.users || [];
    renderTable("usersList", rows, ["id", "name", "email", "role"]);
  } catch (err) {
    box.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ==================== LOANS ====================
async function borrowBook() {
  const user_id = document.getElementById("loanUserId").value.trim();
  const book_id = document.getElementById("loanBookId").value.trim();

  if (!user_id || !book_id) {
    alert("Enter User ID and Book ID");
    return;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const res = await fetch(`${API_BASE}/loans.php?action=borrow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id,
      book_id,
      due_date: dueDate.toISOString().split("T")[0]
    })
  });
  const data = await res.json();
  alert(data.message || "Done");
  listLoans();
}

async function returnBook() {
  const loan_id = document.getElementById("returnLoanId").value.trim();
  if (!loan_id) {
    alert("Enter Loan ID to return.");
    return;
  }

  const res = await fetch(`${API_BASE}/loans.php?action=return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loan_id })
  });
  const data = await res.json();
  alert(data.message || "Done");
  listLoans();
}

async function listLoans() {
  const res = await fetch(`${API_BASE}/loans.php?action=list`);
  const data = await res.json();
  // Expect { status: "success", loans: [...] }
  const rows = data.loans || [];
  renderTable("loansList", rows, [
    "id", "user_id", "book_id", "loan_date", "due_date", "returned", "status"
  ]);
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
