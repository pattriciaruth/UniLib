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
  container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}