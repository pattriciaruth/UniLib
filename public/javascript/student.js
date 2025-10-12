const API_BASE = window.location.origin + "/api";
const user = JSON.parse(localStorage.getItem("user"));

// Redirect if not logged in or wrong role
if (!user || user.role !== "student") {
  alert("Access denied. Please login as a student.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("welcomeMessage").innerText = `Welcome, ${user.name}!`;
});

// ==================== LOGOUT ====================
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ==================== BROWSE / SEARCH BOOKS ====================
async function listAllBooks() {
  try {
    const res = await fetch(`${API_BASE}/books.php?action=list`);
    const data = await res.json();
    renderBooks(data.books || []);
  } catch (err) {
    document.getElementById("booksList").innerHTML = `<p>Error loading books: ${err.message}</p>`;
  }
}

async function searchBooks() {
  const query = document.getElementById("searchQuery").value.trim();
  if (!query) return listAllBooks();

  try {
    const res = await fetch(`${API_BASE}/books.php?action=search&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    renderBooks(data.books || []);
  } catch (err) {
    document.getElementById("booksList").innerHTML = `<p>Error searching books: ${err.message}</p>`;
  }
}

function renderBooks(books) {
  const container = document.getElementById("booksList");
  if (!books.length) {
    container.innerHTML = "<p>No books found.</p>";
    return;
  }

  container.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Title</th><th>Author</th><th>Subject</th><th>Available</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${books
          .map(
            (b) => `
          <tr>
            <td>${b.title}</td>
            <td>${b.author || "-"}</td>
            <td>${b.subject || "-"}</td>
            <td>${b.available ? "✅" : "❌"}</td>
            <td>${
              b.available
                ? `<button onclick="borrowBook(${b.id})">Borrow</button>`
                : `<button disabled>Unavailable</button>`
            }</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

// ==================== BORROW BOOK ====================
async function borrowBook(bookId) {
  if (!confirm("Borrow this book?")) return;

  try {
    const res = await fetch(`${API_BASE}/loans.php?action=borrow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, book_id: bookId })
    });

    const data = await res.json();
    alert(data.message || "Book borrowed!");
    listAllBooks();
    getLoans();
  } catch (err) {
    alert("Error borrowing book: " + err.message);
  }
}

// ==================== LOANS ====================
async function getLoans() {
  const res = await fetch(`${API_BASE}/loans.php?action=list&user_id=${user.id}`);
  const data = await res.json();
  renderTable("loansList", data.loans || []);
}

// ==================== RESERVATIONS ====================
async function getReservations() {
  const res = await fetch(`${API_BASE}/reservations.php?action=list&user_id=${user.id}`);
  const data = await res.json();
  renderTable("reservationsList", data.reservations || []);
}

// ==================== FINES ====================
async function getFines() {
  const res = await fetch(`${API_BASE}/fines.php?action=list&user_id=${user.id}`);
  const data = await res.json();
  renderTable("finesList", data.fines || []);
}

// ==================== HELPER: RENDER TABLE ====================
function renderTable(containerId, rows) {
  const container = document.getElementById(containerId);
  if (!rows || !rows.length) {
    container.innerHTML = "<p>No records found.</p>";
    return;
  }

  const headers = Object.keys(rows[0]);
  const table = `
    <table class="report-table">
      <thead><tr>${headers.map((h) => `<th>${h.replace(/_/g, " ").toUpperCase()}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map(
            (r) =>
              `<tr>${headers
                .map((h) => `<td>${r[h] ?? "-"}</td>`)
                .join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
  container.innerHTML = table;
}
