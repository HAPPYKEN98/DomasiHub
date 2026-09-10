document.addEventListener("DOMContentLoaded", () => {
  initThemeSettings();
  initSecuritySettings();
  initPrivacyModal();
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
  const passwordSuccessModal = document.getElementById("passwordSuccessModal");
  const closeSuccessModalBtn = document.getElementById("closeSuccessModalBtn");

  const settingsWarningModal = document.getElementById("settingsWarningModal");
  const closeWarningModalBtn = document.getElementById("closeWarningModalBtn");
  const warningModalMessage = document.getElementById("warningModalMessage");

  function showWarning(message) {
    if (warningModalMessage) warningModalMessage.textContent = message;
    if (settingsWarningModal) settingsWarningModal.style.display = "flex";
  }

  if (closeWarningModalBtn && settingsWarningModal) {
    closeWarningModalBtn.addEventListener("click", () => {
      settingsWarningModal.style.display = "none";
    });
  }

  if (settingsWarningModal) {
    settingsWarningModal.addEventListener("click", (e) => {
      if (e.target === settingsWarningModal) {
        settingsWarningModal.style.display = "none";
      }
    });
  }

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

  if (passwordModal) {
    passwordModal.addEventListener("click", (e) => {
      if (e.target === passwordModal) {
        passwordModal.style.display = "none";
        passwordForm.reset();
      }
    });
  }

  if (closeSuccessModalBtn && passwordSuccessModal) {
    closeSuccessModalBtn.addEventListener("click", () => {
      passwordSuccessModal.style.display = "none";
    });
  }

  if (passwordSuccessModal) {
    passwordSuccessModal.addEventListener("click", (e) => {
      if (e.target === passwordSuccessModal) {
        passwordSuccessModal.style.display = "none";
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        showWarning("New passwords do not match.");
        return;
      }

      if (newPassword.length < 6) {
        showWarning("Password must be at least 6 characters long.");
        return;
      }

      try {
        const { error } = await window.db.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;

        passwordModal.style.display = "none";
        passwordForm.reset();

        if (passwordSuccessModal) {
          passwordSuccessModal.style.display = "flex";
        }
      } catch (err) {
        console.error("Error updating password:", err);
        showWarning(err.message || "Failed to update password.");
      }
    });
  }
}

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

  if (privacyModal) {
    privacyModal.addEventListener("click", (e) => {
      if (e.target === privacyModal) {
        privacyModal.style.display = "none";
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
