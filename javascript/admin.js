const API_BASE = window.location.origin + "/api";

const user = JSON.parse(localStorage.getItem("user"));

// Redirect if not logged in or wrong role
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
async function getUsageReport() {
  const res = await fetch(`${API_BASE}/reports.php?action=usage&user_id=${user.id}`);
  const data = await res.json();
  renderJson("usageReport", data);
}

async function getOverdue() {
  const res = await fetch(`${API_BASE}/reports.php?action=overdue&user_id=${user.id}`);
  const data = await res.json();
  renderJson("overdueList", data);
}

async function getPopular() {
  const res = await fetch(`${API_BASE}/reports.php?action=popular_books&user_id=${user.id}`);
  const data = await res.json();
  renderJson("popularBooks", data);
}

async function getUserActivity() {
  const targetUserId = document.getElementById("targetUserId").value;
  if (!targetUserId) {
    alert("Please enter a user ID.");
    return;
  }

  const res = await fetch(`${API_BASE}/reports.php?action=user_activity&user_id=${user.id}&target_user_id=${targetUserId}`);
  const data = await res.json();
  renderJson("userActivity", data);
}

// ==================== HELPER ====================
function renderJson(containerId, data) {
  document.getElementById(containerId).innerHTML =
    `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}
