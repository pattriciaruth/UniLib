const API_BASE = window.location.origin + "/api";


// ==================== REGISTER ====================
async function registerUser() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const messageBox = document.getElementById("registerMessage");

  if (!name || !email || !password) {
    messageBox.innerText = "⚠️ All fields are required!";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users.php?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    messageBox.innerText = data.message || "Registration complete.";

    if (data.status === "success") {
      // Redirect to login after 1.5s
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    }
  } catch (err) {
    console.error("Register error:", err);
    messageBox.innerText = "⚠️ Registration failed: " + err.message;
  }
}


// ==================== LOGIN ====================
async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const messageBox = document.getElementById("loginMessage");

  if (!email || !password) {
    messageBox.innerText = "⚠️ Enter email and password!";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users.php?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    console.log("Login response:", data); // Debug log
    messageBox.innerText = data.message || "Login successful.";

    if (data.status === "success" && data.user) {
      // Save user to local storage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect by role
      switch (data.user.role) {
        case "student":
          window.location.href = "dashboard-student.html";
          break;
        case "librarian":
          window.location.href = "dashboard-librarian.html";
          break;
        case "admin":
          window.location.href = "dashboard-admin.html";
          break;
        default:
          window.location.href = "index.html";
      }
    } else {
      messageBox.innerText = data.message || "Invalid credentials.";
    }
  } catch (err) {
    console.error("Login error:", err);
    messageBox.innerText = "⚠️ Login request failed: " + err.message;
  }
}
