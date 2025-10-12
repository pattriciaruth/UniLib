const API_BASE = window.location.origin + "/api";

const user = JSON.parse(localStorage.getItem("user"));

// Redirect if not logged in or not admin
if (!user || user.role !== "admin") {
  alert("Access denied. Please login as an admin.");
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

// ==================== REPORTS ====================

// 📊 Library usage report
async function getUsageReport() {
  try {
    const res = await fetch(`${API_BASE}/reports.php?action=usage&user_id=${user.id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderJson("usageReport", data.data || data);
  } catch (err) {
    document.getElementById("usageReport").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ⏰ Overdue loans report
async function getOverdue() {
  try {
    const res = await fetch(`${API_BASE}/reports.php?action=overdue&user_id=${user.id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderJson("overdueList", data.data || data);
  } catch (err) {
    document.getElementById("overdueList").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ⭐ Popular books report
async function getPopular() {
  try {
    const res = await fetch(`${API_BASE}/reports.php?action=popular_books&user_id=${user.id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderJson("popularBooks", data.data || data);
  } catch (err) {
    document.getElementById("popularBooks").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// 👤 Individual user activity report
async function getUserActivity() {
  const targetUserId = document.getElementById("targetUserId").value.trim();
  if (!targetUserId) {
    alert("Please enter a user ID.");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/reports.php?action=user_activity&user_id=${user.id}&target_user_id=${targetUserId}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderJson("userActivity", data.data || data);
  } catch (err) {
    document.getElementById("userActivity").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ==================== HELPER ====================
function renderJson(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // Unwrap nested "report" object if present
  const content = data.report || data.reports || data.data || data;

  // If it's an object (like {total_users, total_books})
  if (typeof content === "object" && !Array.isArray(content)) {
    const table = document.createElement("table");
    table.border = "1";
    const tbody = document.createElement("tbody");

    for (const [key, value] of Object.entries(content)) {
      const row = document.createElement("tr");
      const cellKey = document.createElement("td");
      const cellValue = document.createElement("td");

      cellKey.textContent = key.replace(/_/g, " ").toUpperCase();
      cellValue.textContent = value;

      row.appendChild(cellKey);
      row.appendChild(cellValue);
      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    container.appendChild(table);
  }

  // If it's an array (like list of books or users)
  else if (Array.isArray(content)) {
    if (content.length === 0) {
      container.innerHTML = "<p>No data available.</p>";
      return;
    }

    const table = document.createElement("table");
    table.border = "1";

    // Headers
    const header = document.createElement("tr");
    Object.keys(content[0]).forEach(key => {
      const th = document.createElement("th");
      th.textContent = key.replace(/_/g, " ").toUpperCase();
      header.appendChild(th);
    });
    table.appendChild(header);

    // Rows
    content.forEach(rowData => {
      const row = document.createElement("tr");
      Object.values(rowData).forEach(val => {
        const td = document.createElement("td");
        td.textContent = val ?? "-";
        row.appendChild(td);
      });
      table.appendChild(row);
    });

    container.appendChild(table);
  }

  // Fallback for text or unknown
  else {
    container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
}
