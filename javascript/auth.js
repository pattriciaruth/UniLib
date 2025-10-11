const API_BASE = window.location.origin + "/api";


// ==================== REGISTER ====================
async function registerUser() {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  if (!name || !email || !password) {
    document.getElementById("registerMessage").innerText = "⚠️ All fields are required!";
    return;
  }

  const res = await fetch(`${API_BASE}/users.php?action=register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();
  document.getElementById("registerMessage").innerText = data.message;

  if (data.status === "success") {
    // Redirect to login after registration
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }
}

// ==================== LOGIN ====================
async function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    document.getElementById("loginMessage").innerText = "⚠️ Enter email and password!";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users.php?action=login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("Login response:", data); // 🔍 Debug

    document.getElementById("loginMessage").innerText = data.message;

    if (data.status === "success") {
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "student") {
        window.location.href = "dashboard-student.html";
      } else if (data.user.role === "librarian") {
        window.location.href = "dashboard-librarian.html";
      } else if (data.user.role === "admin") {
        window.location.href = "dashboard-admin.html";
      }
    }
  } catch (err) {
    console.error("Login error:", err);
    document.getElementById("loginMessage").innerText = "⚠️ Login request failed!";
  }
}
