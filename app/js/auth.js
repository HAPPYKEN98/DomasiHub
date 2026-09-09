document.addEventListener("DOMContentLoaded", () => {
  const fullNameInput = document.getElementById("fullName");
  const whatsappInput = document.getElementById("whatsappNumber");
  const regInput = document.getElementById("regNumber");
  const regFeedback = document.getElementById("validationFeedback");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");
  const passwordFeedback = document.getElementById("passwordFeedback");
  const form = document.getElementById("signUpForm");
  if (!form) return;

  const pattern = /^BED\/(SCI|HUM|SSC|LAC)(?:\/ODEL)?\/\d{3,4}\/\d{2}$/i;

  regInput.addEventListener("blur", () => {
    const valid = !regInput.value.trim() || pattern.test(regInput.value.trim());
    regInput.className = valid ? "" : "invalid";
    regFeedback.textContent = valid ? "" : "Invalid registration number.";
    regFeedback.className = valid ? "" : "feedback-message error";
    regFeedback.style.color = valid ? "" : "#ef4444";
  });

  const checkPasswords = () => {
    const pass = passwordInput.value;
    const confirm = confirmInput.value;

    if (pass && pass.length < 6) {
      passwordInput.className = "invalid";
      passwordFeedback.textContent = "Password must be at least 6 characters.";
      passwordFeedback.className = "feedback-message error";
      passwordFeedback.style.color = "#ef4444";
      return;
    }

    if (!pass) {
      passwordInput.className = "";
      confirmInput.className = "";
      passwordFeedback.textContent = "";
      passwordFeedback.style.color = "";
      return;
    }

    passwordInput.className = "valid";

    if (!confirm) {
      confirmInput.className = "";
      passwordFeedback.textContent = "Password length looks good.";
      passwordFeedback.className = "feedback-message success";
      passwordFeedback.style.color = "#10b981"; // green for success
      return;
    }

    const same = pass === confirm;
    confirmInput.className = same ? "valid" : "invalid";
    passwordFeedback.textContent = same
      ? "Passwords match."
      : "Passwords do not match.";
    passwordFeedback.className =
      "feedback-message " + (same ? "success" : "error");
    passwordFeedback.style.color = same ? "#10b981" : "#ef4444";
  };

  passwordInput.addEventListener("input", checkPasswords);
  confirmInput.addEventListener("input", checkPasswords);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const regNumber = regInput.value.trim().toUpperCase();
    const fullName = fullNameInput.value.trim();
    const password = passwordInput.value;

    const client = window.supabaseClient || window.db;
    if (!client) {
      return showToast(
        "Supabase is not ready. Refresh and try again.",
        "error",
      );
    }
    if (
      !email ||
      !fullName ||
      !pattern.test(regNumber) ||
      !password ||
      password.length < 6 ||
      password !== confirmInput.value
    ) {
      return showToast(
        "Please check fields: password must be at least 6 characters and match.",
        "error",
      );
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Creating account...";
    }

    let signupSuccess = false;

    try {
      const { data, error } = await client.auth.signUp({
        email: email,
        password,
        options: {
          data: {
            full_name: fullName,
            reg_number: regNumber,
            whatsapp_number: whatsappInput.value.trim(),
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Account could not be created.");

      // Safely attempt manual upsert only if session exists and trigger doesn't conflict
      if (data.session) {
        try {
          await client.from("profiles").upsert(
            {
              id: data.user.id,
              full_name: fullName,
              reg_number: regNumber,
              whatsapp_number: whatsappInput.value.trim(),
              email: email,
            },
            { onConflict: "id" },
          );
        } catch (profileErr) {
          console.warn(
            "Profile upsert handled by trigger or skipped:",
            profileErr,
          );
        }
      }

      localStorage.setItem("user_name", fullName);
      localStorage.setItem("user_fullname", fullName);
      localStorage.setItem("user_reg", regNumber);

      if (data.session) {
        localStorage.setItem("isLoggedIn", "true");
        showToast("Account Created! Redirecting...", "success");
        setTimeout(goNext, 1000);
      } else {
        signupSuccess = true;
        const authCardContainer = document.getElementById("authCardContainer");
        if (authCardContainer) {
          authCardContainer.innerHTML = `
            <div style="text-align: center; padding: 1rem 0;">
                <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 48px; height: 48px; color: var(--primary-color, #0066FF);">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                </div>
                <h2 style="margin-bottom: 0.5rem;">Verify Your Email</h2>
                <p class="auth-subtitle" style="margin-bottom: 1.5rem;">
                    We've sent a confirmation link to <strong>${email}</strong>. Please check your inbox and click the link to activate your student account.
                </p>
                <a href="signin.html" class="btn-primary btn-block" style="display: block; text-align: center; text-decoration: none; width: 100%;">
                    Proceed to Sign In
                </a>
            </div>
          `;
        }
      }
    } catch (err) {
      console.error(err);
      let errMsg = err.message || "Registration failed.";

      if (
        errMsg.includes("duplicate key") ||
        errMsg.includes("already exists") ||
        errMsg.includes("Database error saving new user")
      ) {
        errMsg = "This registration number is already registered.";
      }

      showToast(errMsg, "error");
    } finally {
      if (submit && !signupSuccess) {
        submit.disabled = false;
        submit.textContent = "Create Account";
      }
    }
  });

  function goNext() {
    location.href =
      new URLSearchParams(location.search).get("redirect") || "profile.html";
  }
});

function showToast(message, type = "info") {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    document.body.appendChild(toast);
  }

  const bgColor = type === "success" ? "#10b981" : "#ff0101";

  toast.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px);
    background: ${bgColor}; color: #f8fafc;
    padding: 12px 24px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    transition: transform 0.3s ease; z-index: 9999; font-weight: 500; font-size: 0.9rem;
    border: 1px solid #202553;
  `;

  toast.textContent = message;
  toast.style.transform = "translateX(-50%) translateY(0)";
  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(100px)";
  }, 3500);
}
