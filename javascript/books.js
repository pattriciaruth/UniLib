const API_BASE = "http://localhost/unilib/api";

// Load all books on page load
window.onload = () => {
  listBooks();
};

async function listBooks() {
  const res = await fetch(`${API_BASE}/books.php?action=list`);
  const data = await res.json();

  if (data.status === "success") {
    renderBooks(data.books);
  } else {
    document.getElementById("booksList").innerText = data.message;
  }
}

async function searchBooks() {
  const query = document.getElementById("searchQuery").value;
  const res = await fetch(`${API_BASE}/books.php?action=search&q=${encodeURIComponent(query)}`);
  const data = await res.json();

  if (data.status === "success") {
    renderBooks(data.books);
  } else {
    document.getElementById("booksList").innerText = data.message;
  }
}

function renderBooks(books) {
  const container = document.getElementById("booksList");
  container.innerHTML = "";

  if (books.length === 0) {
    container.innerHTML = "<p>No books found.</p>";
    return;
  }

  books.forEach(book => {
    const div = document.createElement("div");
    div.className = "book-card";
    div.innerHTML = `
      <h3>${book.title}</h3>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>ISBN:</strong> ${book.isbn}</p>
      <p><strong>Year:</strong> ${book.published_year || "N/A"}</p>
      <p><strong>Copies Available:</strong> ${book.copies}</p>
    `;
    container.appendChild(div);
  });
}
