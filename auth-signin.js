//  BACKEND URL
const API_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:3000' 
  : 'https://domasi-hub-production.up.railway.app';

document.addEventListener('DOMContentLoaded', () => {
    const regInput = document.getElementById('regNumber');
    const regFeedback = document.getElementById('validationFeedback');
    const passwordInput = document.getElementById('password');
    const signInForm = document.getElementById('signInForm');

    if (!signInForm) return;

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
            regFeedback.textContent = "Invalid credentials format.";
            regFeedback.className = "feedback-message error";
        }
    });

    regInput.addEventListener('focus', () => {
        regInput.className = "";
        regFeedback.textContent = "";
    });

    signInForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const rawReg = regInput.value.trim().toUpperCase();
        const isRegValid = /^BED\/(SCI|HUM|SSC|LAC)(?:\/ODEL)?\/\d{3,4}\/\d{2}$/i.test(rawReg);

        if (!isRegValid || passwordInput.value.trim() === "") {
            showToast("Invalid sign-in attempt. Please verify your entries.", "error");
            return;
        }

        const payload = {
            regNumber: rawReg,
            password: passwordInput.value
        };

        fetch(`${API_URL}/api/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                // Store across all common localStorage keys for global compatibility
                localStorage.setItem('user_name', data.user.fullname);
                localStorage.setItem('user_fullname', data.user.fullname);
                localStorage.setItem('fullname', data.user.fullname);
                localStorage.setItem('user_reg', data.user.regNumber);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('isLoggedIn', 'true');

                // Modern Success Popup Call
                showSuccessModal("Login Successful!", `Welcome back, ${data.user.fullname}! Redirecting...`, () => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectTarget = urlParams.get('redirect') || 'portal.html';
                    window.location.href = redirectTarget;
                });
            } else {
                showToast(data.message || "Invalid sign-in credentials.", "error");
            }
        })
        .catch(err => {
            console.error("Error connecting to API layer:", err);
            showToast("Unable to reach authentication server.", "error");
        });
    });
});

// Fancy Modern Pop-up Modal System
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

    // Auto proceed after 1.8s
    setTimeout(proceed, 1800);
}

// Global Toast Fallback
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