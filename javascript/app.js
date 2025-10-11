const API_BASE = window.location.origin + "/api";

// Helper: show JSON result
function showResult(id, data) {
  document.getElementById(id).innerText = JSON.stringify(data, null, 2);
}

// ==================== USERS ====================
async function registerUser() {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  const res = await fetch(`${API_BASE}/users.php?action=register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  showResult("registerResult", data);
}

async function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${API_BASE}/users.php?action=login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  showResult("loginResult", data);
}

// ==================== BOOKS ====================
async function addBook() {
  const title = document.getElementById("bookTitle").value;
  const author = document.getElementById("bookAuthor").value;
  const isbn = document.getElementById("bookIsbn").value;
  const published_year = document.getElementById("bookYear").value;

  const res = await fetch(`${API_BASE}/books.php?action=add`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ title, author, isbn, published_year, copies: 1 })
  });
  const data = await res.json();
  showResult("booksResult", data);
}

async function listBooks() {
  const res = await fetch(`${API_BASE}/books.php?action=list`);
  const data = await res.json();
  showResult("booksResult", data);
}

// ==================== REPORTS ====================
async function getUsageReport() {
  const res = await fetch(`${API_BASE}/reports.php?action=usage`);
  const data = await res.json();
  showResult("reportsResult", data);
}

async function getOverdue() {
  const res = await fetch(`${API_BASE}/reports.php?action=overdue`);
  const data = await res.json();
  showResult("reportsResult", data);
}

async function getPopular() {
  const res = await fetch(`${API_BASE}/reports.php?action=popular_books`);
  const data = await res.json();
  showResult("reportsResult", data);
}

async function getUserActivity() {
  const userId = document.getElementById("userId").value;
  const res = await fetch(`${API_BASE}/reports.php?action=user_activity&user_id=${userId}`);
  const data = await res.json();
  showResult("reportsResult", data);
}
