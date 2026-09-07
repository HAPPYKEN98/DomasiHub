document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("app_initialized")) {
    localStorage.setItem("app_initialized", "true");
    localStorage.setItem("is_new_user", "true");
  }

  // Target explicit protected triggers instead of broad attribute selectors
  const protectedTriggers = document.querySelectorAll(".requires-auth");

  protectedTriggers.forEach((element) => {
    element.addEventListener("click", async (e) => {
      const targetHref = element.getAttribute("href");
      const client = window.supabaseClient || window.db;

      let session = null;
      if (client) {
        const res = await client.auth.getSession();
        session = res.data.session;
      }

      if (!session) {
        e.preventDefault();

        if (targetHref && targetHref !== "#") {
          sessionStorage.setItem("redirect_after_auth", targetHref);
        }

        const isNewUser = localStorage.getItem("is_new_user") === "true";
        window.location.href = isNewUser ? "signup.html" : "signin.html";
      }
    });
  });
});
