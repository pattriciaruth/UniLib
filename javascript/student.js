const API_BASE = window.location.origin + "/api";

const user = JSON.parse(localStorage.getItem("user"));

// Redirect if not logged in or wrong role
if (!user || user.role !== "student") {
  alert("Access denied. Please login as a student.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("welcomeMessage").innerText = `Welcome, ${user.name}!`;
  getLoans();
  getReservations();
  getFines();
});

// ==================== LOGOUT ====================
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ==================== LOANS ====================
async function getLoans() {
  const res = await fetch(`${API_BASE}/loans.php?action=list&user_id=${user.id}`);
  const data = await res.json();
  renderList("loansList", data.loans || [], ["book_title", "loan_date", "due_date", "returned"]);
}

// ==================== RESERVATIONS ====================
async function getReservations() {
  const res = await fetch(`${API_BASE}/reservations.php?action=list&user_id=${user.id}`);
  const data = await res.json();
  renderList("reservationsList", data.reservations || [], ["book_title", "reserved_at", "fulfilled"]);
}

// ==================== FINES ====================
async function getFines() {
  const res = await fetch(`${API_BASE}/fines.php?action=list&user_id=${user.id}`);
  const data = await res.json();
  renderList("finesList", data.fines || [], ["loan_id", "amount", "paid"]);
}

// ==================== HELPER: RENDER LIST ====================
function renderList(containerId, items, fields) {
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
    th.innerText = field.replace("_", " ").toUpperCase();
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
