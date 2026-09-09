document.addEventListener("DOMContentLoaded", () => {
  initThemeSettings();
  initSecuritySettings();
  initAboutSettings();
});

function initThemeSettings() {
  const themeRadios = document.querySelectorAll(
    'input[name="theme-preference"]',
  );
  const currentTheme = localStorage.getItem("theme") || "system";

  themeRadios.forEach((radio) => {
    if (radio.value === currentTheme) {
      radio.checked = true;
    }

    radio.addEventListener("change", (e) => {
      const selectedTheme = e.target.value;
      localStorage.setItem("theme", selectedTheme);

      // Force the attribute update immediately
      if (selectedTheme === "system") {
        const systemDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        document.documentElement.setAttribute(
          "data-theme",
          systemDark ? "dark" : "light",
        );
      } else {
        document.documentElement.setAttribute("data-theme", selectedTheme);
      }

      // Safely call applyTheme if it exists externally, without blocking DOM changes
      if (typeof applyTheme === "function") {
        try {
          applyTheme(selectedTheme);
        } catch (err) {
          console.error("Error in external applyTheme:", err);
        }
      }
    });
  });
}

function initSecuritySettings() {
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const passwordModal = document.getElementById("passwordModal");
  const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
  const passwordForm = document.getElementById("passwordForm");

  if (changePasswordBtn && passwordModal) {
    changePasswordBtn.addEventListener("click", () => {
      passwordModal.style.display = "flex";
    });
  }

  if (cancelPasswordBtn && passwordModal) {
    cancelPasswordBtn.addEventListener("click", () => {
      passwordModal.style.display = "none";
      passwordForm.reset();
    });
  }

  // Close modal when clicking backdrop background
  if (passwordModal) {
    passwordModal.addEventListener("click", (e) => {
      if (e.target === passwordModal) {
        passwordModal.style.display = "none";
        passwordForm.reset();
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
      }

      if (newPassword.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
      }

      try {
        const { error } = await window.db.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;

        alert("Password updated successfully.");
        passwordModal.style.display = "none";
        passwordForm.reset();
      } catch (err) {
        console.error("Error updating password:", err);
        alert(err.message || "Failed to update password.");
      }
    });
  }
}

function initAboutSettings() {
  const signOutBtn = document.getElementById("signOutBtn");

  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      try {
        if (window.db && window.db.auth) {
          await window.db.auth.signOut();
        }
        localStorage.clear();
        window.location.href = "index.html";
      } catch (err) {
        console.error("Error signing out:", err);
        window.location.href = "index.html";
      }
    });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  initThemeSettings();
  initSecuritySettings();
  initPrivacyModal(); // Add this line
  initAboutSettings();
});

// ... keep your other functions ...

function initPrivacyModal() {
  const privacyPolicyBtn = document.getElementById("privacyPolicyBtn");
  const privacyModal = document.getElementById("privacyModal");
  const closePrivacyBtn = document.getElementById("closePrivacyBtn");

  if (privacyPolicyBtn && privacyModal) {
    privacyPolicyBtn.addEventListener("click", () => {
      privacyModal.style.display = "flex";
    });
  }

  if (closePrivacyBtn && privacyModal) {
    closePrivacyBtn.addEventListener("click", () => {
      privacyModal.style.display = "none";
    });
  }

  // Close modal when clicking backdrop background
  if (privacyModal) {
    privacyModal.addEventListener("click", (e) => {
      if (e.target === privacyModal) {
        privacyModal.style.display = "none";
      }
    });
  }
}