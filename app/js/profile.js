import { requireAuth } from "./lib/guard.js";
import { profile, signOut } from "./lib/auth.js";
import { initials } from "./lib/security.js";
const s = await requireAuth();
if (s) {
  const p = await profile().catch(() => null);
  document.querySelector("#avatar").textContent = initials(
    p?.full_name || s.user.email,
  );
  document.querySelector("#name").textContent = p?.full_name || "Student";
  document.querySelector("#reg").textContent =
    p?.reg_number || "Registration number unavailable";
  document.querySelector("#email").textContent = s.user.email;
  if (p?.whatsapp_number) {
    const w = document.querySelector("#whatsapp");
    if (w) w.textContent = p.whatsapp_number;
  }
}
document
  .querySelector("[data-signout]")
  ?.addEventListener("click", async () => {
    await signOut();
    location.href = "signin.html";
  });
