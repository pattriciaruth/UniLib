const API_BASE = window.location.origin + "/api";

// Helper: show JSON result
function showResult(id, data) {
  document.getElementById(id).innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

// ==================== USERS ====================
async function registerUser() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if (!name || !email || !password) {
    alert("Please fill in all registration fields.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users.php?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    showResult("registerResult", data);
  } catch (err) {
    showResult("registerResult", { status: "error", message: err.message });
  }
}

async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users.php?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    showResult("loginResult", data);
  } catch (err) {
    showResult("loginResult", { status: "error", message: err.message });
  }
}

// ==================== BOOKS ====================
async function addBook() {
  const title = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const isbn = document.getElementById("bookIsbn").value.trim();
  const published_year = document.getElementById("bookYear").value.trim();

  if (!title || !author || !isbn) {
    alert("Please fill in Title, Author, and ISBN.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/books.php?action=add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, isbn, published_year, copies: 1 }),
    });
    const data = await res.json();
    showResult("booksResult", data);
  } catch (err) {
    showResult("booksResult", { status: "error", message: err.message });
  }
}

async function listBooks() {
  try {
    const res = await fetch(`${API_BASE}/books.php?action=list`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    showResult("booksResult", data.data || data);
  } catch (err) {
    showResult("booksResult", { status: "error", message: err.message });
  }
}

// ==================== REPORTS ====================
async function getUsageReport() {
  try {
    const res = await fetch(`${API_BASE}/reports.php?action=usage`);
    const data = await res.json();
    showResult("reportsResult", data.data || data);
  } catch (err) {
    showResult("reportsResult", { status: "error", message: err.message });
  }
}

async function getOverdue() {
  try {
    const res = await fetch(`${API_BASE}/reports.php?action=overdue`);
    const data = await res.json();
    showResult("reportsResult", data.data || data);
  } catch (err) {
    showResult("reportsResult", { status: "error", message: err.message });
  }
}

async function getPopular() {
  try {
    const res = await fetch(`${API_BASE}/reports.php?action=popular_books`);
    const data = await res.json();
    showResult("reportsResult", data.data || data);
  } catch (err) {
    showResult("reportsResult", { status: "error", message: err.message });
  }
}

async function getUserActivity() {
  const userId = document.getElementById("userId").value.trim();
  if (!userId) {
    alert("Please enter a user ID.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reports.php?action=user_activity&user_id=${userId}`);
    const data = await res.json();
    showResult("reportsResult", data.data || data);
  } catch (err) {
    showResult("reportsResult", { status: "error", message: err.message });
  }
}