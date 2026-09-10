(function () {
  const HAS_SEEN_WELCOME = "hasSeenWelcome";

  // Instant check for returning users (Capacitor & Web)
  if (localStorage.getItem(HAS_SEEN_WELCOME) === "true") {
    window.location.replace("home.html");
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const actionButtons = document.querySelectorAll(".welcome-actions a");
    const overlay = document.getElementById("pageTransitionOverlay");

    actionButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        // Mark that the user has now seen the welcome screen
        localStorage.setItem(HAS_SEEN_WELCOME, "true");

        e.preventDefault();
        const targetUrl = button.getAttribute("href");

        // Trigger the fade-in loading curtain for all links
        if (overlay) {
          overlay.classList.add("active");
        }

        // Wait 5000ms (5 seconds) before redirecting to the target page
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 5000);
      });
    });
  });
})();
