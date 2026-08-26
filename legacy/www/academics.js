const API_URL = window.location.hostname.includes('localhost') 
    ? 'http://localhost:3000' 
    : 'https://domasi-hub-production.up.railway.app';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Check Auth Navigation state & dynamic user session
    setupAuthNav();

    // 2. Fetch initial resources
    fetchResources();

    // 3. Search & Department Filters
    const searchInput = document.getElementById("searchInput");
    const deptFilter = document.getElementById("departmentFilter");

    if (searchInput) searchInput.addEventListener("input", debounce(fetchResources, 300));
    if (deptFilter) deptFilter.addEventListener("change", fetchResources);

    // 4. Modal Handlers
    const modal = document.getElementById("uploadModal");
    const openBtn = document.getElementById("openUploadModalBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelUploadBtn");
    const uploadForm = document.getElementById("uploadForm");

    if (openBtn) {
        openBtn.addEventListener("click", () => {
            const currentUser = getLoggedInUser();
            if (!currentUser) {
                showToast("Please sign in to upload study materials.", "info");
                setTimeout(() => {
                    window.location.href = "signin.html?redirect=academics.html";
                }, 1200);
                return;
            }
            modal.classList.add("active");
        });
    }

    const closeModal = () => modal && modal.classList.remove("active");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // 5. Upload Handler
    if (uploadForm) uploadForm.addEventListener("submit", handleUploadSubmit);
});

// Helper function to reliably get signed-in user data
function getLoggedInUser() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) return null;

    const directName = localStorage.getItem("user_name") || 
                       localStorage.getItem("user_fullname") || 
                       localStorage.getItem("fullname") || 
                       localStorage.getItem("username");
    if (directName) return { fullname: directName };

    const userObjStr = localStorage.getItem("user");
    if (userObjStr) {
        try {
            return JSON.parse(userObjStr);
        } catch (e) {
            console.error("Error parsing stored user JSON:", e);
        }
    }

    return null;
}

function setupAuthNav() {
    const container = document.getElementById("authNavContainer");
    if (!container) return;

    const user = getLoggedInUser();

    if (user && (user.fullname || user.user_fullname)) {
        const displayName = escapeHTML(user.fullname || user.user_fullname);
        container.innerHTML = `
            <span class="user-greeting">👋 ${displayName}</span>
            <a href="portal.html" class="btn-nav-register">Portal</a>
            <button onclick="handleLogout()" class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; cursor:pointer;">Sign Out</button>
        `;
    } else {
        container.innerHTML = `
            <a href="signin.html?redirect=academics.html" class="btn-nav-signin">Sign In</a>
            <a href="signup.html?redirect=academics.html" class="btn-nav-register">Sign Up</a>
        `;
    }
}

function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_fullname");
    localStorage.removeItem("fullname");
    localStorage.removeItem("username");
    localStorage.removeItem("user_reg");
    localStorage.removeItem("user");
    showToast("Signed out successfully", "info");
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

async function fetchResources() {
    const grid = document.getElementById("resourcesGrid");
    if (!grid) return;

    const searchInput = document.getElementById("searchInput");
    const deptFilter = document.getElementById("departmentFilter");

    const searchVal = searchInput ? searchInput.value.trim() : "";
    const deptVal = deptFilter ? deptFilter.value : "";

    let url = `${API_URL}/api/academics?`;
    const params = new URLSearchParams();

    if (searchVal) params.append("search", searchVal);
    if (deptVal) params.append("department", deptVal);

    try {
        const response = await fetch(url + params.toString());
        if (!response.ok) {
            throw new Error(`Server status ${response.status}`);
        }
        const data = await response.json();

        if (data.status === "success" && data.resources) {
            renderResources(data.resources);
        } else {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No academic resources found.</p>`;
        }
    } catch (err) {
        console.error("Failed to fetch academic resources:", err);
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">Failed to connect to server.</p>`;
    }
}

function renderResources(resources) {
    const grid = document.getElementById("resourcesGrid");
    grid.innerHTML = "";

    if (resources.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No matching documents found.</p>`;
        return;
    }

    resources.forEach(item => {
        const card = document.createElement("div");
        card.className = "module-card";

        const courseCode = item.course_code ? ` [${item.course_code.toUpperCase()}]` : "";
        const uploadedBy = item.uploaded_by || "Anonymous Student";

        card.innerHTML = `
            <div>
                <span class="featured-badge">${escapeHTML(item.department)}</span>
                <h4 style="font-size: 1.2rem; margin-top: 0.5rem;">${escapeHTML(item.title)}${escapeHTML(courseCode)}</h4>
                <p style="font-size: 0.88rem; margin-top: 0.25rem;">
                    Level: ${escapeHTML(item.academic_year || 'N/A')}
                </p>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.5rem;">
                    Shared by: <strong>${escapeHTML(uploadedBy)}</strong> | Downloads: <strong id="dl-count-${item.id}">${item.download_count}</strong>
                </p>
            </div>
            <button onclick="downloadResource(${item.id}, '${escapeHTML(item.title)}')" class="btn-primary" style="margin-top: auto;">
                📥 Download Resource
            </button>
        `;

        grid.appendChild(card);
    });
}

async function handleUploadSubmit(e) {
    e.preventDefault();

    const user = getLoggedInUser();
    if (!user || (!user.fullname && !user.user_fullname)) {
        showToast("You must be signed in to upload resources.", "error");
        setTimeout(() => {
            window.location.href = "signin.html?redirect=academics.html";
        }, 1200);
        return;
    }

    const regNumber = localStorage.getItem('user_reg') || localStorage.getItem('regNumber') || '';
    const rawName = user.fullname || user.user_fullname;
    const formattedUploader = regNumber ? `${rawName} (${regNumber})` : rawName;

    const title = document.getElementById("resourceTitle").value.trim();
    const department = document.getElementById("resourceDept").value;
    const academic_year = document.getElementById("resourceYear").value.trim();
    const course_code = document.getElementById("resourceCode").value.trim();
    const fileInput = document.getElementById("resourceFile");

    if (!fileInput.files || fileInput.files.length === 0) {
        showToast("Please attach a document file.", "error");
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
        showToast("File size exceeds 10MB limit.", "error");
        return;
    }

    try {
        const base64File = await convertFileToBase64(file);

        const payload = {
            title,
            department,
            academic_year,
            course_code,
            file_data: base64File,
            uploaded_by: formattedUploader
        };

        const response = await fetch(`${API_URL}/api/academics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Upload failed (${response.status}): ${errText}`);
        }

        const data = await response.json();

        if (data.status === "success") {
            showToast("Resource uploaded successfully!", "success");
            document.getElementById("uploadForm").reset();
            document.getElementById("uploadModal").classList.remove("active");
            fetchResources();
        } else {
            showToast("Failed to upload: " + (data.message || "Unknown error"), "error");
        }
    } catch (err) {
        console.error("Upload error:", err);
        showToast("Server error uploading resource: " + err.message, "error");
    }
}

async function downloadResource(id, filename) {
    try {
        const response = await fetch(`${API_URL}/api/academics/download/${id}`);
        if (!response.ok) throw new Error("Download endpoint returned error");

        const data = await response.json();

        if (data.status === "success" && data.file_data) {
            const a = document.createElement("a");
            a.href = data.file_data;
            a.download = filename || "academic_document";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            const countElem = document.getElementById(`dl-count-${id}`);
            if (countElem) {
                countElem.textContent = parseInt(countElem.textContent) + 1;
            }
            showToast("Download started!", "success");
        } else {
            showToast("Failed to download file.", "error");
        }
    } catch (err) {
        console.error("Download error:", err);
        showToast("Error connecting to server for download.", "error");
    }
}

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `fancy-toast toast-${type}`;
    
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}