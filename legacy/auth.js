//  BACKEND URL
const API_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:3000' 
  : 'https://domasi-hub-production.up.railway.app';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element Selectors
    const fullNameInput = document.getElementById('fullName');
    const whatsappInput = document.getElementById('whatsappNumber');
    const regInput = document.getElementById('regNumber');
    const regFeedback = document.getElementById('validationFeedback');
    
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const passwordFeedback = document.getElementById('passwordFeedback');
    
    const signUpForm = document.getElementById('signUpForm');

    if (!signUpForm) return;

    // 1. Validation on blur
    regInput.addEventListener('blur', () => {
        const value = regInput.value.trim();
        const regPattern = /^BED\/(SCI|HUM|SSC|LAC)(?:\/ODEL)?\/\d{3,4}\/\d{2}$/i;

        if (value === "") {
            regInput.className = "";
            regFeedback.textContent = "";
            return;
        }

        if (regPattern.test(value)) {
            regInput.className = "";
            regFeedback.textContent = "";
        } else {
            regInput.className = "invalid";
            regFeedback.textContent = "Invalid entry.";
            regFeedback.className = "feedback-message error";
        }
    });

    regInput.addEventListener('focus', () => {
        regInput.className = "";
        regFeedback.textContent = "";
    });

    // 2. Live Password Matching Validation
    const checkPasswords = () => {
        const pass = passwordInput ? passwordInput.value : "";
        const confirmPass = confirmInput ? confirmInput.value : "";

        if (confirmPass === "") {
            if (confirmInput) confirmInput.className = "";
            if (passwordFeedback) passwordFeedback.textContent = "";
            return;
        }

        if (pass === confirmPass) {
            if (confirmInput) confirmInput.className = "valid";
            if (passwordFeedback) {
                passwordFeedback.textContent = "Passwords match.";
                passwordFeedback.className = "feedback-message success";
            }
        } else {
            if (confirmInput) confirmInput.className = "invalid";
            if (passwordFeedback) {
                passwordFeedback.textContent = "Passwords do not match.";
                passwordFeedback.className = "feedback-message error";
            }
        }
    };

    if (passwordInput) passwordInput.addEventListener('input', checkPasswords);
    if (confirmInput) confirmInput.addEventListener('input', checkPasswords);

    // 3. Prevent Form Submission If Submitting Invalid Info & Send to Backend
    signUpForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const rawReg = regInput.value.trim().toUpperCase();
        const isRegValid = /^BED\/(SCI|HUM|SSC|LAC)(?:\/ODEL)?\/\d{3,4}\/\d{2}$/i.test(rawReg);
        const pass = passwordInput ? passwordInput.value : "";
        const confirmPass = confirmInput ? confirmInput.value : "";
        const doPasswordsMatch = pass === confirmPass;

        if (!isRegValid || !doPasswordsMatch || pass === "" || fullNameInput.value.trim() === "") {
            showToast("Please complete the form correctly before continuing.", "error");
            return;
        }

        const payload = {
            fullname: fullNameInput.value.trim(),
            regNumber: rawReg,
            whatsapp: whatsappInput.value.trim(),
            password: pass
        };

        fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                // Uniformly populate keys
                localStorage.setItem('user_name', payload.fullname);
                localStorage.setItem('user_fullname', payload.fullname);
                localStorage.setItem('fullname', payload.fullname);
                localStorage.setItem('user_reg', payload.regNumber);
                localStorage.setItem('user', JSON.stringify({ fullname: payload.fullname, regNumber: payload.regNumber }));
                localStorage.setItem('isLoggedIn', 'true');

                showSuccessModal("Account Created!", "Your registration was successful. Redirecting...", () => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectTarget = urlParams.get('redirect') || 'portal.html';
                    window.location.href = redirectTarget;
                });
            } else {
                showToast(data.message || "Registration failed.", "error");
            }
        })
        .catch(err => {
            console.error("Error connecting to API layer:", err);
            showToast("Unable to reach authentication server.", "error");
        });
    });
});

// Fancy Success Modal
function showSuccessModal(title, message, callback) {
    let overlay = document.getElementById("successModalOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "successModalOverlay";
        overlay.className = "modal-overlay";
        overlay.innerHTML = `
            <div class="auth-card popup-modal-card">
                <div class="popup-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h3 id="popupModalTitle" style="text-align: center; margin-top: 0.75rem;">${title}</h3>
                <p id="popupModalMsg" style="text-align: center; color: var(--text-secondary); margin-bottom: 1.25rem;">${message}</p>
                <button id="popupModalBtn" class="btn-primary btn-block">Continue</button>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        document.getElementById("popupModalTitle").textContent = title;
        document.getElementById("popupModalMsg").textContent = message;
    }

    overlay.classList.add("active");

    const proceed = () => {
        overlay.classList.remove("active");
        if (callback) callback();
    };

    document.getElementById("popupModalBtn").onclick = proceed;

    setTimeout(proceed, 1800);
}

// Global Toast Notification
function showToast(message, type = "error") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `fancy-toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === "success" ? "✓" : "✕"}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}