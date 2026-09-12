// profile.js

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser();

    if (authError || !user) {
      location.href = "signin.html?redirect=profile.html";
      return;
    }

    const { data: p, error: profileError } = await db
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    const fullName = p?.full_name || "Student";
    const initials = getInitials(fullName);
    const avatarSvg = generateAvatarSvg(initials);

    // 1. Render Profile Card (Sign out button removed)
    const profileCard = document.getElementById("profileCard");
    profileCard.innerHTML = `
      <div class="profile-avatar-container">${avatarSvg}</div>
      <h2>${escapeHtml(fullName)}</h2>
      <p class="profile-reg">${escapeHtml(
        p?.reg_number || "No registration number",
      )}</p>
      <p>WhatsApp: ${escapeHtml(p?.whatsapp_number || "Not provided")}</p>
      <div class="profile-actions" style="margin-top: 1rem;">
        <a href="my-uploads.html" class="btn-sky" style="text-align: center; text-decoration: none; display: block;">My Uploads</a>
      </div>
    `;

    // 2. Render Settings, Report Problem & App Version Card
    const appSettingsSection = document.getElementById("appSettingsSection");
    if (appSettingsSection) {
      appSettingsSection.innerHTML = `
        <div class="settings-card">
          <h3>Preferences & Support</h3>
          <ul class="settings-list">
            <li>
              <a href="settings.html" class="settings-item">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span>Settings</span>
              </a>
            </li>
            <li>
              <button class="settings-item dropdown-toggle" id="reportToggleBtn">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                <span>Report a Problem</span>
              </button>
              <div class="report-form-container" id="reportFormContainer" style="display: none;">
                <textarea id="reportMessage" placeholder="Describe the issue you are facing..." rows="3"></textarea>
                <button class="btn-primary" id="sendReportBtn">Send Report</button>
              </div>
            </li>
          </ul>
          <div class="app-version-footer">
            <span>Domasi Hub &bull; v1.0.0</span>
          </div>
        </div>
      `;

      // Toggle report problem field drawer
      document
        .getElementById("reportToggleBtn")
        .addEventListener("click", () => {
          const form = document.getElementById("reportFormContainer");
          form.style.display = form.style.display === "none" ? "flex" : "none";
        });

      // Handle mail dispatch targeting domasihub@gmail.com using logged-in user email
      document.getElementById("sendReportBtn").addEventListener("click", () => {
        const msg = document.getElementById("reportMessage").value.trim();
        if (!msg) {
          showCustomModal(
            "Please describe the issue you are facing before sending.",
          );
          return;
        }
        const loggedInEmail = user.email || "student@domasihub.edu";
        const subject = encodeURIComponent(
          `Problem Report - Domasi Hub User (${loggedInEmail})`,
        );
        const body = encodeURIComponent(
          `Sender Account Email: ${loggedInEmail}\n\nIssue Details:\n${msg}`,
        );
        window.location.href = `mailto:domasihub@gmail.com?subject=${subject}&body=${body}`;
      });
    }

    const signOutBtn = document.getElementById("signOutBtn");
    if (signOutBtn) {
      signOutBtn.addEventListener("click", async () => {
        await db.auth.signOut();
        location.href = "home.html";
      });
    }
  } catch (err) {
    console.error("Error loading profile:", err);
    document.getElementById("profileCard").innerHTML =
      "<p>Failed to load profile details. Please try refreshing.</p>";
  }
});

function getInitials(name) {
  if (!name) return "DH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function generateAvatarSvg(initials) {
  return `
    <svg viewBox="0 0 80 80" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0066FF"/>
          <stop offset="100%" stop-color="#00D4FF"/>
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill="url(#avatarGrad)" />
      <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="26" font-weight="700" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1px">${initials}</text>
    </svg>
  `;
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showCustomModal(message) {
  let modalOverlay = document.getElementById("customModalOverlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "customModalOverlay";
    modalOverlay.className = "custom-modal-overlay";
    modalOverlay.innerHTML = `
      <div class="custom-modal">
        <div class="custom-modal-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
        </div>
        <p id="customModalMessage"></p>
        <button class="btn-primary" id="customModalCloseBtn">OK</button>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    document
      .getElementById("customModalCloseBtn")
      .addEventListener("click", () => {
        modalOverlay.classList.remove("active");
      });

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove("active");
      }
    });
  }

  document.getElementById("customModalMessage").textContent = message;
  modalOverlay.classList.add("active");
}
