document.addEventListener("DOMContentLoaded", () => {
  setupAuthNav();
  fetchResources();

  const searchInput = document.getElementById("searchInput");
  const deptFilter = document.getElementById("departmentFilter");
  const searchBtn = document.getElementById("searchBtn");

  if (searchInput) {
    searchInput.addEventListener("input", debounce(fetchResources, 300));
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        fetchResources();
        searchInput.blur(); // Dismisses mobile keyboard to stop UI layout shifts
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      fetchResources();
      if (searchInput) searchInput.blur();
    });
  }

  if (deptFilter) deptFilter.addEventListener("change", fetchResources);

  const modal = document.getElementById("uploadModal");
  const openBtn = document.getElementById("openUploadModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelUploadBtn");
  const uploadForm = document.getElementById("uploadForm");

  // Strict check on the open button click
  if (openBtn) {
    openBtn.addEventListener("click", (e) => {
      const user = getLoggedInUser();
      if (!user) {
        e.preventDefault();
        e.stopPropagation();
        showToast(
          "Authentication required. Redirecting to sign in...",
          "error",
        );
        setTimeout(() => {
          window.location.href = "signin.html?redirect=academics.html";
        }, 500);
        return;
      }
      if (modal) modal.classList.add("active");
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

  if (uploadForm) uploadForm.addEventListener("submit", handleUploadSubmit);
});

function getLoggedInUser() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) return null;

  const directName =
    localStorage.getItem("user_name") ||
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
            <span class="user-greeting" style="display: inline-flex; align-items: center; gap: 6px;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; color: var(--primary-color);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                ${displayName}
            </span>
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

  const client = window.supabaseClient || window.db;
  if (!client) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: red;">Database client not ready.</p>`;
    return;
  }

  const searchInput = document.getElementById("searchInput");
  const deptFilter = document.getElementById("departmentFilter");

  const searchVal = searchInput ? searchInput.value.trim() : "";
  const deptVal = deptFilter ? deptFilter.value : "";

  try {
    let query = client
      .from("academic_resources")
      .select(
        "id, title, department, academic_year, course_code, uploaded_by, download_count",
      );

    if (deptVal) {
      query = query.eq("department", deptVal);
    }

    if (searchVal) {
      query = query.ilike("title", `%${searchVal}%`);
    }

    const { data: resources, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    if (resources && resources.length > 0) {
      renderResources(resources);
    } else {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No matching documents found.</p>`;
    }
  } catch (err) {
    console.error("Failed to fetch academic resources:", err);
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">Failed to connect to database.</p>`;
  }
}

function renderResources(resources) {
  const grid = document.getElementById("resourcesGrid");
  if (!grid) return;
  grid.innerHTML = "";

  resources.forEach((item) => {
    const card = document.createElement("div");
    card.className = "module-card";
    card.style.cssText =
      "background: var(--bg-surface); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column; justify-content: space-between;";

    const courseCode = item.course_code
      ? ` [${item.course_code.toUpperCase()}]`
      : "";
    const uploadedBy = item.uploaded_by || "Anonymous Student";

    card.innerHTML = `
            <div>
                <span class="featured-badge" style="display: inline-block; padding: 0.2rem 0.6rem; font-size: 0.75rem; border-radius: 4px; background: rgba(0, 102, 255, 0.1); color: var(--primary-color); font-weight: 600; margin-bottom: 0.5rem;">${escapeHTML(
                  item.department,
                )}</span>
                <h4 style="font-size: 1.1rem; margin: 0.25rem 0 0.5rem 0; color: var(--text-main);">${escapeHTML(
                  item.title,
                )}${escapeHTML(courseCode)}</h4>
                <p style="font-size: 0.88rem; margin: 0.25rem 0; color: var(--text-secondary);">
                    Level: ${escapeHTML(item.academic_year || "N/A")}
                </p>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.5rem;">
                    Shared by: <strong>${escapeHTML(
                      uploadedBy,
                    )}</strong> | Downloads: <strong id="dl-count-${item.id}">${
      item.download_count || 0
    }</strong>
                </p>
            </div>
            <button onclick="downloadResource(${item.id}, '${escapeHTML(
      item.title,
    ).replace(
      /'/g,
      "\\'",
    )}')" class="btn-primary" style="margin-top: 1.25rem; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; padding: 0.6rem; border-radius: 6px; background: var(--primary-color); color: white; cursor: pointer; border: none; width: 100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Resource
            </button>
        `;

    grid.appendChild(card);
  });
}

async function handleUploadSubmit(e) {
  e.preventDefault();

  const user = getLoggedInUser();
  if (!user) {
    showToast("Please sign in to upload study materials.", "error");
    setTimeout(() => {
      window.location.href = "signin.html?redirect=academics.html";
    }, 800);
    return;
  }

  const client = window.supabaseClient || window.db;
  if (!client) {
    showToast("Database client not initialized.", "error");
    return;
  }

  const uploadForm = document.getElementById("uploadForm");
  const submitBtn = uploadForm
    ? uploadForm.querySelector('button[type="submit"]')
    : null;
  const originalBtnText = submitBtn ? submitBtn.innerHTML : "Upload Resource";

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";
    submitBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
      Uploading...
    `;
  }

  try {
    const regNumber =
      localStorage.getItem("user_reg") ||
      localStorage.getItem("regNumber") ||
      localStorage.getItem("user_reg_number") ||
      "";
    const rawName = user.fullname || user.user_fullname;
    const formattedUploader = regNumber ? `${rawName} (${regNumber})` : rawName;

    const title = document.getElementById("resourceTitle").value.trim();
    const department = document.getElementById("resourceDept").value;
    const academic_year = document.getElementById("resourceYear").value.trim();
    const course_code = document.getElementById("resourceCode").value.trim();
    const fileInput = document.getElementById("resourceFile");

    if (!fileInput.files || fileInput.files.length === 0) {
      throw new Error("Please attach a document file.");
    }

    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size exceeds 10MB limit.");
    }

    const fileExt = file.name.split(".").pop();
    const uniqueFileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`;
    const filePath = `${department
      .toLowerCase()
      .replace(/\s+/g, "_")}/${uniqueFileName}`;

    const { error: uploadError } = await client.storage
      .from("academic-files")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = client.storage
      .from("academic-files")
      .getPublicUrl(filePath);

    const filePublicUrl = publicUrlData.publicUrl;

    const payload = {
      title,
      department,
      academic_year,
      course_code,
      file_data: filePublicUrl,
      uploaded_by: formattedUploader,
      download_count: 0,
    };

    const { error } = await client.from("academic_resources").insert([payload]);
    if (error) throw error;

    const bulletinPayload = {
      notice_type: "academic_resource",
      title: `New Study Material: ${title}`,
      description: `A new resource for ${department} (${
        course_code || "General"
      }) was uploaded by ${formattedUploader}.`,
      posted_by: formattedUploader,
    };

    await client.from("bulletins").insert([bulletinPayload]);

    showToast("Resource uploaded successfully!", "success");
    if (uploadForm) uploadForm.reset();
    const modal = document.getElementById("uploadModal");
    if (modal) modal.classList.remove("active");
    fetchResources();
  } catch (err) {
    console.error("Upload error:", err);
    showToast("Error: " + err.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

async function downloadResource(id, filename) {
  const client = window.supabaseClient || window.db;
  if (!client) return;

  const btn = document.querySelector(
    `button[onclick*="downloadResource(${id},"]`,
  );
  const originalHtml = btn ? btn.innerHTML : "";

  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
      Downloading...
    `;
  }

  try {
    const { data: item, error } = await client
      .from("academic_resources")
      .select("file_data, download_count, title")
      .eq("id", id)
      .single();

    if (error || !item || !item.file_data) {
      throw new Error("File not found.");
    }

    const fileUrl = item.file_data;

    // If running inside the Capacitor native mobile app
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      // Force open in external system browser/downloader which triggers native Android download manager
      const { Browser } = window.Capacitor.Plugins || {};
      if (Browser) {
        await Browser.open({ url: fileUrl });
      } else {
        window.open(fileUrl, "_system");
      }
    } else {
      // Web browser fallback: fetch blob to force custom filename download
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      // Clean up the filename using the item title if provided
      const cleanTitle = (filename || item.title || "document").replace(
        /[^a-zA-Z0-9-_]/g,
        "_",
      );
      const extension = fileUrl.split(".").pop().split("?")[0] || "pdf";
      a.download = `${cleanTitle}.${extension}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    }

    const newCount = (item.download_count || 0) + 1;
    await client
      .from("academic_resources")
      .update({ download_count: newCount })
      .eq("id", id);

    const countElem = document.getElementById(`dl-count-${id}`);
    if (countElem) countElem.textContent = newCount;
    showToast("Download started", "success");
  } catch (err) {
    console.error("Download error:", err);
    showToast("Failed to download file.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.innerHTML = originalHtml;
    }
  }
}
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(
    /[&<>'"]/g,
    (tag) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[
        tag
      ] || tag),
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

  const icon =
    type === "success"
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  toast.innerHTML = `
        <span class="toast-icon" style="display:inline-flex; align-items:center;">${icon}</span>
        <span class="toast-message">${escapeHTML(message)}</span>
    `;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

const fileInput = document.getElementById("resourceFile");
const fileNameDisplay = document.getElementById("fileNameDisplay");

if (fileInput && fileNameDisplay) {
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      fileNameDisplay.textContent = e.target.files[0].name;
    } else {
      fileNameDisplay.textContent = "No file chosen";
    }
  });
}
