(function () {
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Inject the transition overlay markup dynamically if it doesn't exist
    if (!document.getElementById("pageTransitionOverlay")) {
      const overlayHtml = `
        <div id="pageTransitionOverlay" class="transition-overlay">
          <div class="transition-spinner">
            <div class="spinner-ring"></div>
            <img src="assets/logo.svg" alt="Domasi Hub" class="spinner-logo" />
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", overlayHtml);
    }

    const overlay = document.getElementById("pageTransitionOverlay");

    // Fix for Back/Forward cache freeze (when using phone navigation buttons)
    window.addEventListener("pageshow", (event) => {
      if (event.persisted && overlay) {
        overlay.classList.remove("active");
      }
    });

    // 2. Intercept internal links across the app
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");

      // Filter for internal HTML page links (ignoring anchors, external links, or javascript actions)
      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("http") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        link.getAttribute("target") !== "_blank"
      ) {
        e.preventDefault();

        // Trigger the fade-in curtain
        if (overlay) {
          overlay.classList.add("active");
        }

        // Wait 2000ms (2 seconds) before navigating to the next page
        setTimeout(() => {
          window.location.href = href;
        }, 2000); // 2000ms delay for the transition effect
      }
    });
  });
})();
