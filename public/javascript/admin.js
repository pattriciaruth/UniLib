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
    renderJson("usageReport", data.report || data);
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
    renderJson("overdueList", data.report || data);
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
    renderJson("popularBooks", data.report || data);
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

    const activity = data.report || data;
    const container = document.getElementById("userActivity");
    container.innerHTML = "";

    // Summary
    const summaryTable = `
      <table class="report-table">
        <tr><th>User ID</th><td>${activity.user_id}</td></tr>
        <tr><th>Total Loans</th><td>${activity.total_loans}</td></tr>
        <tr><th>Unpaid Fines</th><td>${activity.unpaid_fines}</td></tr>
      </table>
    `;

    // Loan history
    let historyHTML = "";
    if (activity.loan_history && activity.loan_history.length > 0) {
      historyHTML = `
        <h3>Loan History</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Loan Date</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${activity.loan_history
              .map(
                (loan) => `
              <tr class="${loan.status.toLowerCase()}">
                <td>${loan.book_title}</td>
                <td>${loan.loan_date}</td>
                <td>${loan.due_date}</td>
                <td>${loan.status}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`;
    } else {
      historyHTML = "<p>No loan history found for this user.</p>";
    }

    container.innerHTML = summaryTable + historyHTML;
  } catch (err) {
    document.getElementById("userActivity").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ==================== TABLE RENDERER ====================
function renderJson(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const content = data.report || data.data || data;

  if (!content) {
    container.innerHTML = "<p>No data available.</p>";
    return;
  }

  // Object-based data
  if (typeof content === "object" && !Array.isArray(content)) {
    const table = `
      <table class="report-table">
        <thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>
          ${Object.entries(content)
            .map(
              ([key, val]) =>
                `<tr><td>${key.replace(/_/g, " ").toUpperCase()}</td><td>${val}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    container.innerHTML = table;
    return;
  }

  // Array-based data
  if (Array.isArray(content)) {
    if (content.length === 0) {
      container.innerHTML = "<p>No data found.</p>";
      return;
    }

    const headers = Object.keys(content[0]);
    const table = `
      <table class="report-table">
        <thead><tr>${headers.map((h) => `<th>${h.replace(/_/g, " ").toUpperCase()}</th>`).join("")}</tr></thead>
        <tbody>
          ${content
            .map(
              (row) =>
                `<tr>${headers.map((h) => `<td>${row[h] ?? "-"}</td>`).join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    container.innerHTML = table;
    return;
  }

  container.innerHTML = `<pre>${JSON.stringify(content, null, 2)}</pre>`;
}
