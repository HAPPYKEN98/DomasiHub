import { signIn, session } from "./lib/auth.js";
import { message, loading } from "./lib/ui.js";
const form = document.querySelector("#signinForm"),
  out = document.querySelector("#formMessage"),
  btn = document.querySelector("#signinButton");
const next = new URLSearchParams(location.search).get("next");
const dest =
  next && /\.html/.test(next) && !next.startsWith("http") ? next : "home.html";
session()
  .then((s) => {
    if (s) location.href = dest;
  })
  .catch(() => {});
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const email = String(fd.get("email") || "").trim();
  const password = fd.get("password") || "";
  if (!email || !password) {
    message(out, "Enter your email and password.");
    return;
  }
  try {
    loading(btn, true, "Signing in...");
    await signIn(email, password);
    location.href = dest;
  } catch (err) {
    console.error(err);
    message(
      out,
      err.message?.toLowerCase().includes("invalid login")
        ? "Incorrect email or password."
        : err.message || "Unable to sign in.",
    );
  } finally {
    loading(btn, false);
  }
});
