let allListings = [];
let allAcademicResources = [];

// BACKEND URL
const API_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:3000' 
  : 'https://domasi-hub-production.up.railway.app';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Auth Navigation UI Setup
    setupAuthNav();

    // 2. Load Homepage Data (Listings + Academic Resources)
    loadHomepageData();
    fetchAcademicVaultResources();

    // 3. Search Bar Event Listeners
    const searchBtn = document.getElementById("heroSearchBtn");
    const searchInput = document.getElementById("heroSearchInput");
    const clearBtn = document.getElementById("clearSearchBtn");

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => handleSearch());
        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") handleSearch();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            renderSearchResults(allListings.slice(0, 3), [], false);
            renderAcademicVault(allAcademicResources.slice(0, 3));
        });
    }
});

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
            <a href="portal.html" class="btn-nav-register">Go to Portal</a>
            <button onclick="logout()" style="padding:0.55rem 1rem; background:#ef4444; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600;">
                Logout
            </button>
        `;
    } else {
        container.innerHTML = `
            <a href="signin.html" class="btn-nav-signin">Sign In</a>
            <a href="signup.html" class="btn-nav-register">Register</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_fullname');
    localStorage.removeItem('fullname');
    localStorage.removeItem('username');
    localStorage.removeItem('user_reg');
    localStorage.removeItem('user');
    window.location.href = "index.html";
}

async function loadHomepageData() {
    const featuredGrid = document.getElementById("featured-grid");
    
    try {
        const response = await fetch(`${API_URL}/api/listings`);
        const data = await response.json();

        if (data.status === "success" && data.listings) {
            allListings = data.listings;

            const formatCount = (count, singular, plural) => 
                `${count} ${count === 1 ? singular : plural}`;

            const marketCount = allListings.filter(item => item.category === "marketplace").length;
            const printCount = allListings.filter(item => item.category === "printing").length;
            const roomCount = allListings.filter(item => item.category === "accommodation").length;
            
            updateTotalActiveCounter();

            if (document.getElementById("marketplaceCount")) document.getElementById("marketplaceCount").textContent = formatCount(marketCount, "item", "items");
            if (document.getElementById("printingCount")) document.getElementById("printingCount").textContent = formatCount(printCount, "station", "stations");
            if (document.getElementById("accommodationCount")) document.getElementById("accommodationCount").textContent = formatCount(roomCount, "unit", "units");

            renderSearchResults(allListings.slice(0, 3), [], false);
        }
    } catch (error) {
        console.error("Failed to load portal data for home page:", error);
        if (featuredGrid) {
            featuredGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: red;">Failed to load dynamic listings.</p>`;
        }
    }
}

async function fetchAcademicVaultResources() {
    const container = document.getElementById("academicVaultContainer");
    const uploadsCount = document.getElementById("academicUploadsCount");

    try {
        const response = await fetch(`${API_URL}/api/academics`);
        const data = await response.json();

        if (data.status === "success" && data.resources) {
            allAcademicResources = data.resources;

            if (uploadsCount) {
                uploadsCount.textContent = allAcademicResources.length;
            }

            updateTotalActiveCounter();
            renderAcademicVault(allAcademicResources.slice(0, 3));
        } else if (container) {
            container.innerHTML = `<p style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 1rem;">No academic files available yet.</p>`;
        }
    } catch (err) {
        console.error("Failed to fetch academic vault resources:", err);
        if (container) {
            container.innerHTML = `<p style="text-align: center; color: #ef4444; font-size: 0.85rem; padding: 1rem;">Failed to connect to academic repository.</p>`;
        }
    }
}

function renderAcademicVault(resources) {
    const container = document.getElementById("academicVaultContainer");
    if (!container) return;

    if (!resources || resources.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 1rem;">No matching study materials found.</p>`;
        return;
    }

    container.innerHTML = "";
    resources.forEach(item => {
        const row = document.createElement("div");
        row.className = "preview-row";
        row.style.cursor = "pointer";
        row.style.transition = "background 0.2s ease";
        row.title = "Click to download resource";

        const courseCode = item.course_code ? ` • ${item.course_code.toUpperCase()}` : "";
        const uploader = item.uploaded_by || "Anonymous";

        row.innerHTML = `
            <span class="file-icon">📚</span>
            <div class="file-info" style="flex: 1; overflow: hidden;">
                <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${escapeHTML(item.title)}</strong>
                <small>${escapeHTML(item.department)}${escapeHTML(courseCode)} | By ${escapeHTML(uploader)}</small>
            </div>
            <button onclick="downloadAcademicFile(${item.id}, '${escapeHTML(item.title)}')" class="btn-primary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; border-radius: 8px; flex-shrink: 0;">
                📥
            </button>
        `;

        row.addEventListener("mouseover", () => row.style.background = "rgba(255, 255, 255, 0.1)");
        row.addEventListener("mouseout", () => row.style.background = "rgba(255, 255, 255, 0.04)");

        container.appendChild(row);
    });
}

function filterAcademicVault(department) {
    const headerTitle = document.getElementById("vaultHeaderTitle");
    if (headerTitle) headerTitle.textContent = department.toLowerCase().replace(/\s+/g, '_');

    const filtered = allAcademicResources.filter(item => item.department === department);
    renderAcademicVault(filtered.slice(0, 3));
}

async function downloadAcademicFile(id, filename) {
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
        } else {
            alert("Failed to download file.");
        }
    } catch (err) {
        console.error("Download error:", err);
        alert("Error connecting to server for download.");
    }
}

function updateTotalActiveCounter() {
    const totalActiveElem = document.getElementById("totalActiveCount");
    if (totalActiveElem) {
        const combinedCount = allListings.length + allAcademicResources.length;
        totalActiveElem.textContent = `${combinedCount} Total Live Resources & Listings`;
    }
}

function handleSearch() {
    const searchInput = document.getElementById("heroSearchInput");
    if (!searchInput) return;

    const rawQuery = searchInput.value.trim();
    const query = rawQuery.toLowerCase();

    if (!query) {
        renderSearchResults(allListings.slice(0, 3), [], false);
        renderAcademicVault(allAcademicResources.slice(0, 3));
        return;
    }

    const queryNoSpaces = query.replace(/\s+/g, '');
    const filteredListings = allListings.filter(item => {
        const titleMatch = (item.title || "").toLowerCase().includes(query);
        const locationMatch = (item.location_details || "").toLowerCase().includes(query);
        const conditionMatch = (item.item_condition || item.security_condition || "").toLowerCase().includes(query);
        const categoryMatch = (item.category || "").toLowerCase().includes(query);
        return titleMatch || locationMatch || conditionMatch || categoryMatch;
    });

    const filteredAcademics = allAcademicResources.filter(item => {
        const titleMatch = (item.title || "").toLowerCase().includes(query);
        const deptMatch = (item.department || "").toLowerCase().includes(query);
        const rawCode = (item.course_code || "").toLowerCase();
        const codeMatch = rawCode.includes(query) || rawCode.replace(/\s+/g, '').includes(queryNoSpaces);
        return titleMatch || deptMatch || codeMatch;
    });

    renderSearchResults(filteredListings, filteredAcademics, true, rawQuery);
    renderAcademicVault(filteredAcademics.slice(0, 3));
}

function renderSearchResults(listingsItems = [], academicItems = [], isSearchResult = false, query = "") {
    const featuredGrid = document.getElementById("featured-grid");
    const featuredTitle = document.getElementById("featuredTitle");
    const featuredSubtitle = document.getElementById("featuredSubtitle");
    const clearBtn = document.getElementById("clearSearchBtn");

    if (!featuredGrid) return;

    const totalResultsCount = listingsItems.length + academicItems.length;

    if (isSearchResult) {
        if (featuredTitle) featuredTitle.textContent = `Search Results (${totalResultsCount})`;
        if (featuredSubtitle) featuredSubtitle.textContent = `Results matching "${query}"`;
        if (clearBtn) clearBtn.style.display = "inline-block";
    } else {
        if (featuredTitle) featuredTitle.textContent = "Featured Highlights";
        if (featuredSubtitle) featuredSubtitle.textContent = "Trending listings and active services available today.";
        if (clearBtn) clearBtn.style.display = "none";
    }

    if (totalResultsCount > 0) {
        featuredGrid.innerHTML = "";

        academicItems.forEach(item => {
            const card = document.createElement("div");
            card.className = "module-card";
            card.style.borderColor = "rgba(16, 185, 129, 0.4)";

            const courseCode = item.course_code ? item.course_code.toUpperCase() : "MODULE";
            const uploader = item.uploaded_by || "Anonymous";

            card.innerHTML = `
                <div>
                    <span class="featured-badge" style="background: linear-gradient(135deg, #10b981, #059669); display:inline-block; margin-bottom: 0.5rem;">
                        📚 Academic Resource
                    </span>
                    <h4 style="margin: 0 0 0.5rem 0;">${escapeHTML(item.title)}</h4>
                </div>
                <div style="background: rgba(16, 185, 129, 0.08); border-radius: 8px; border: 1px dashed rgba(16, 185, 129, 0.3); padding: 1.2rem; text-align: center;">
                    <div style="font-size: 2.2rem; margin-bottom: 0.2rem;">📄</div>
                    <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-core);">${escapeHTML(courseCode)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHTML(item.department)}</div>
                </div>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                    Uploaded by: <strong>${escapeHTML(uploader)}</strong>
                </p>
                <button onclick="downloadAcademicFile(${item.id}, '${escapeHTML(item.title)}')" class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); text-align: center; margin-top: auto; border: none;">
                    📥 Download Paper / Resource
                </button>
            `;
            featuredGrid.appendChild(card);
        });

        listingsItems.forEach(item => {
            const card = document.createElement("div");
            card.className = "module-card";

            const priceFormatted = "MWK " + parseFloat(item.price || 0).toLocaleString();
            const imageSrc = item.image_path || "https://via.placeholder.com/300x200?text=No+Image";

            let badgeText = "New Upload";
            let targetPage = "marketplace.html";
            let buttonLabel = "View Item";

            if (item.category === "printing") {
                badgeText = "Print Station";
                targetPage = "printing.html";
                buttonLabel = "Print Assignment";
            } else if (item.category === "accommodation") {
                badgeText = "Verified Unit";
                targetPage = "accommodation.html";
                buttonLabel = "Inspect Room";
            } else if (item.category === "marketplace") {
                badgeText = "Hot Deal";
                targetPage = "marketplace.html";
                buttonLabel = "View in Market";
            }

            card.innerHTML = `
                <div>
                    <span class="featured-badge" style="display:inline-block; margin-bottom: 0.5rem;">${badgeText}</span>
                    <h4 style="margin: 0 0 0.5rem 0;">${escapeHTML(item.title) || 'Untitled Listing'}</h4>
                </div>
                <div style="background: rgba(0, 0, 0, 0.03); border-radius: 8px; border: 1px solid var(--border-subtle); overflow: hidden; padding: 4px;">
                    <img src="${imageSrc}" alt="${escapeHTML(item.title) || 'Listing'}" style="width:100%; height:160px; object-fit:contain; border-radius:6px; display:block;">
                </div>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">
                    ${escapeHTML(item.location_details || item.security_condition || item.item_condition) || 'Active on Domasi Hub'}
                </p>
                <div style="font-weight: 700; color: var(--primary-color); font-size: 1.1rem; margin-top: auto;">${priceFormatted}</div>
                <a href="${targetPage}" class="btn-primary" style="text-align: center; margin-top: 0.75rem;">${buttonLabel}</a>
            `;
            featuredGrid.appendChild(card);
        });

    } else {
        featuredGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No matching listings or academic resources found on the platform.</p>`;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}