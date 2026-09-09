document.addEventListener("DOMContentLoaded", () => {
  applyStoredTheme();

  // Listen for theme preference changes from settings page radios
  const themeRadios = document.querySelectorAll(
    'input[name="theme-preference"]',
  );
  if (themeRadios.length > 0) {
    themeRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        setTheme(e.target.value);
      });
    });
  }

  // Keep legacy support for an isolated button toggle if present
  const themeToggleBtn = document.getElementById("themeToggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const current = localStorage.getItem("theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);

      // Sync radio button if present on page
      const matchingRadio = document.querySelector(
        `input[name="theme-preference"][value="${next}"]`,
      );
      if (matchingRadio) matchingRadio.checked = true;
    });
  }
});

function applyStoredTheme() {
  const savedTheme = localStorage.getItem("theme") || "system";
  setTheme(savedTheme, false);

  // Sync settings radio state if it exists on the page
  const activeRadio = document.querySelector(
    `input[name="theme-preference"][value="${savedTheme}"]`,
  );
  if (activeRadio) {
    activeRadio.checked = true;
  }
}

function setTheme(themeMode, save = true) {
  if (save) {
    localStorage.setItem("theme", themeMode);
  }

  const bodyElement = document.body;

  if (themeMode === "system") {
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    document.documentElement.setAttribute(
      "data-theme",
      systemPrefersDark ? "dark" : "light",
    );
    if (systemPrefersDark) {
      bodyElement.classList.add("dark-theme");
    } else {
      bodyElement.classList.remove("dark-theme");
    }
  } else if (themeMode === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    bodyElement.classList.add("dark-theme");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    bodyElement.classList.remove("dark-theme");
  }
}

// Global hook if other scripts need to call it
window.applyTheme = (theme) => setTheme(theme, true);
