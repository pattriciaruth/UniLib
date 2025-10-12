const API_BASE = window.location.origin + "/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const showAllBtn = document.getElementById("showAll");

  // Initial load
  listBooks();

  // Handle search submit
  form.addEventListener("submit", e => {
    e.preventDefault();
    const term = searchInput.value.trim();
    if (term) searchBooks(term);
  });

  // Handle "Show All"
  showAllBtn.addEventListener("click", () => {
    searchInput.value = "";
    listBooks();
  });
});

// Fetch all books
async function listBooks() {
  try {
    const res = await fetch(`${API_BASE}/books.php?action=list`);
    const data = await res.json();
    renderBooks(data.books || []);
  } catch (err) {
    console.error(err);
    document.getElementById("booksList").innerHTML = "<p>Error loading books.</p>";
  }
}

// Search books
async function searchBooks(query) {
  try {
    const res = await fetch(`${API_BASE}/books.php?action=search&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    renderBooks(data.books || []);
  } catch (err) {
    console.error(err);
    document.getElementById("booksList").innerHTML = "<p>Error searching books.</p>";
  }
}

// Render book list
function renderBooks(books) {
  const container = document.getElementById("booksList");
  container.innerHTML = "";

  if (!books.length) {
    container.innerHTML = "<p>No books found.</p>";
    return;
  }

  const table = document.createElement("table");
  table.border = "1";
  const header = document.createElement("tr");
  ["ID", "Title", "Author", "Subject", "Available", "ISBN", "Copies"].forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    header.appendChild(th);
  });
  table.appendChild(header);

  books.forEach(book => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${book.id}</td>
      <td>${book.title}</td>
      <td>${book.author || "-"}</td>
      <td>${book.subject || "-"}</td>
      <td>${book.available ? "✅" : "❌"}</td>
      <td>${book.isbn || "-"}</td>
      <td>${book.copies || 0}</td>
    `;
    table.appendChild(row);
  });

  container.appendChild(table);
}

