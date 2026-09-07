function getLoggedInUser() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) return null;

  const directName =
    localStorage.getItem("user_name") ||
    localStorage.getItem("user_fullname") ||
    localStorage.getItem("fullname") ||
    localStorage.getItem("username");
  if (directName) return { fullname: directName };

  const userObjStr = localStorage.getItem("user");
  if (userObjStr) {
    try {
      return JSON.parse(userObjStr);
    } catch (e) {
      console.error("Error parsing stored user JSON:", e);
    }
  }

  return null;
}

function setupAuthNav() {
  const container = document.getElementById("authNavContainer");
  if (!container) return;

  const user = getLoggedInUser();

  if (user && (user.fullname || user.user_fullname)) {
    const displayName = escapeHTML(user.fullname || user.user_fullname);
    container.innerHTML = `
      <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 8px; color: inherit;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        <span>${displayName}</span>
      </div>
      <a href="portal.html" style="background: #2563eb; color: white; padding: 6px 14px; border-radius: 6px; font-size: 0.85rem; text-decoration: none; font-weight: 500; transition: background 0.2s;">Go to Portal</a>
      <button id="logoutBtn" style="background: transparent; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 5px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; font-weight: 500; transition: all 0.2s;">Logout</button>
    `;

    document.getElementById("logoutBtn").addEventListener("click", logout);
  } else {
    container.innerHTML = `
      <a href="signin.html" class="btn-nav-signin">Sign In</a>
      <a href="signup.html" class="btn-nav-register">Register</a>
    `;
  }
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_fullname");
  localStorage.removeItem("fullname");
  localStorage.removeItem("username");
  localStorage.removeItem("user_reg");
  localStorage.removeItem("user");
  window.location.href = "home.html";
}
