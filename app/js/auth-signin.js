document.addEventListener("DOMContentLoaded", () => {
  const regInput = document.getElementById("regNumber");
  const passwordInput = document.getElementById("password");
  const feedback = document.getElementById("validationFeedback");
  const form = document.getElementById("signInForm");
  if (!form) return;

  const pattern = /^BED\/(SCI|HUM|SSC|LAC)(?:\/ODEL)?\/\d{3,4}\/\d{2}$/i;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const regNumber = regInput.value.trim().toUpperCase();
    const password = passwordInput.value;

    if (!pattern.test(regNumber) || !password) {
      if (feedback) {
        feedback.textContent =
          "Enter a valid registration number and password.";
        feedback.style.color = "#ef4444";
      }
      return showToast(
        "Please enter your registration number and password.",
        "error",
      );
    }

    if (!window.db) {
      return showToast(
        "Supabase is not ready. Refresh and try again.",
        "error",
      );
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Signing in...";
    }

    try {
      // 1. Securely fetch the email using the database function (bypasses RLS safely)
      const { data: userEmail, error: rpcError } = await db.rpc(
        "get_email_by_reg",
        { reg: regNumber },
      );

      if (rpcError || !userEmail) {
        throw new Error("No account found with this registration number.");
      }

      // 2. Authenticate with Supabase Auth using the resolved email
      const { data: authData, error: authError } =
        await db.auth.signInWithPassword({
          email: userEmail,
          password: password,
        });

      if (authError) throw authError;

      // 3. Fetch full profile details now that an active session exists
      const { data: profileData } = await db
        .from("profiles")
        .select("full_name, reg_number")
        .eq("reg_number", regNumber)
        .maybeSingle();

      const fullName = profileData?.full_name || "Student";

      localStorage.setItem("user_name", fullName);
      localStorage.setItem("user_fullname", fullName);
      localStorage.setItem("user_reg", regNumber);
      localStorage.setItem("isLoggedIn", "true");

      showToast(`Welcome back, ${fullName}! Redirecting...`, "success");

      setTimeout(() => {
        location.href =
          new URLSearchParams(location.search).get("redirect") || "profile.html";
      }, 1000);
    } catch (err) {
      console.error(err);
      if (feedback) {
        feedback.textContent = "Invalid registration number or password.";
        feedback.style.color = "#ef4444";
      }
      showToast("Sign in failed. Check your credentials.", "error");
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Sign In";
      }
    }
  });
});

function showToast(message, type = "info") {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px);
      padding: 12px 24px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); 
      transition: transform 0.3s ease; z-index: 9999; font-weight: 500; font-size: 0.9rem;
      border: 1px solid transparent;
    `;
    document.body.appendChild(toast);
  }

  if (type === "error") {
    toast.style.background = "#7f1d1d";
    toast.style.color = "#fee2e2";
    toast.style.borderColor = "#ef4444";
  } else if (type === "success") {
    toast.style.background = "#064e3b";
    toast.style.color = "#ecfdf5";
    toast.style.borderColor = "#10b981";
  } else {
    toast.style.background = "#1e293b";
    toast.style.color = "#f8fafc";
    toast.style.borderColor = "#334155";
  }

  toast.textContent = message;
  toast.style.transform = "translateX(-50%) translateY(0)";
  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(100px)";
  }, 3500);
}
