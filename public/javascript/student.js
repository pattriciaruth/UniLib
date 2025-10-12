const API_BASE = window.location.origin + "/api";
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "student") {
  alert("Access denied. Please login as a student.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("welcomeMessage").innerText = `Welcome, ${user.name}!`;
  loadBooks();
  getLoans();
  getReservations();
  getFines();
});

// ==================== LOGOUT ====================
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ==================== BOOKS ====================
async function loadBooks() {
  try {
    const res = await fetch(`${API_BASE}/books.php?action=list`);
    if (!res.ok) throw new Error("Failed to load books");
    const data = await res.json();

    const container = document.getElementById("booksList");
    container.innerHTML = "";

    if (!data.books || data.books.length === 0) {
      container.innerHTML = "<p>No books found.</p>";
      return;
    }

    const table = document.createElement("table");
    table.border = "1";
    const header = document.createElement("tr");
    ["Title", "Author", "Subject", "Copies", "Action"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      header.appendChild(th);
    });
    table.appendChild(header);

    data.books.forEach(b => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${b.title}</td>
        <td>${b.author || "-"}</td>
        <td>${b.subject || "-"}</td>
        <td>${b.copies}</td>
        <td>
          ${
            b.copies > 0
              ? `<button onclick="borrowBook(${b.id})">Borrow</button>`
              : `<button onclick="reserveBook(${b.id})">Reserve</button>`
          }
        </td>
      `;
      table.appendChild(row);
    });

    container.appendChild(table);
  } catch (err) {
    document.getElementById("booksList").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

async function borrowBook(bookId) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  try {
    const res = await fetch(`${API_BASE}/loans.php?action=borrow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        book_id: bookId,
        due_date: dueDate.toISOString().split("T")[0]
      })
    });

    const data = await res.json();
    alert(data.message);
    loadBooks();
    getLoans();
  } catch (err) {
    alert("Error borrowing book: " + err.message);
  }
}

async function reserveBook(bookId) {
  if (!confirm("This book is currently unavailable. Reserve it for later?")) return;

  try {
    const res = await fetch(`${API_BASE}/reservations.php?action=reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, book_id: bookId })
    });

    const data = await res.json();
    alert(data.message);
    getReservations();
  } catch (err) {
    alert("Error reserving book: " + err.message);
  }
}

// ==================== LOANS ====================
async function getLoans() {
  try {
    const res = await fetch(`${API_BASE}/loans.php?action=list&user_id=${user.id}`);
    const data = await res.json();

    const container = document.getElementById("loansList");
    container.innerHTML = "";

    if (!data.loans || data.loans.length === 0) {
      container.innerHTML = "<p>No current loans.</p>";
      return;
    }

    const table = document.createElement("table");
    table.border = "1";
    const header = document.createElement("tr");
    ["Book", "Loan Date", "Due Date", "Status", "Action"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      header.appendChild(th);
    });
    table.appendChild(header);

    data.loans.forEach(l => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${l.book_title}</td>
        <td>${l.loan_date}</td>
        <td>${l.due_date}</td>
        <td>${l.status}</td>
        <td>
          ${l.returned == 0 ? `<button onclick="returnBook(${l.id})">Return</button>` : "-"}
        </td>
      `;
      table.appendChild(row);
    });

    container.appendChild(table);
  } catch (err) {
    document.getElementById("loansList").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

async function returnBook(loanId) {
  try {
    const res = await fetch(`${API_BASE}/loans.php?action=return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loan_id: loanId })
    });

    const data = await res.json();
    alert(data.message);
    getLoans();
    loadBooks();
  } catch (err) {
    alert("Error returning book: " + err.message);
  }
}

// ==================== RESERVATIONS ====================
async function getReservations() {
  try {
    const res = await fetch(`${API_BASE}/reservations.php?action=list&user_id=${user.id}`);
    const data = await res.json();

    const container = document.getElementById("reservationsList");
    container.innerHTML = "";

    if (!data.reservations || data.reservations.length === 0) {
      container.innerHTML = "<p>No reservations found.</p>";
      return;
    }

    const table = document.createElement("table");
    table.border = "1";
    const header = document.createElement("tr");
    ["Book", "Date", "Status"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      header.appendChild(th);
    });
    table.appendChild(header);

    data.reservations.forEach(r => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${r.book_title}</td>
    <td>${r.reservation_date}</td>
    <td>${r.status}</td>
    <td>
      ${r.status === "fulfilled"
        ? `<button onclick="borrowBook(${r.book_id})">Borrow Now</button>`
        : ""}
    </td>
  `;
  table.appendChild(row);
  });


    container.appendChild(table);
  } catch (err) {
    document.getElementById("reservationsList").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ==================== FINES ====================
async function getFines() {
  try {
    const res = await fetch(`${API_BASE}/fines.php?action=list&user_id=${user.id}`);
    const data = await res.json();

    const container = document.getElementById("finesList");
    container.innerHTML = "";

    if (!data.fines || data.fines.length === 0) {
      container.innerHTML = "<p>No fines.</p>";
      return;
    }

    const table = document.createElement("table");
    table.border = "1";
    const header = document.createElement("tr");
    ["Amount", "Status", "Created"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      header.appendChild(th);
    });
    table.appendChild(header);

    data.fines.forEach(f => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>$${f.amount}</td>
        <td>${f.paid ? "Paid" : "Unpaid"}</td>
        <td>${f.created_at}</td>
      `;
      table.appendChild(row);
    });

    container.appendChild(table);
  } catch (err) {
    document.getElementById("finesList").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}
