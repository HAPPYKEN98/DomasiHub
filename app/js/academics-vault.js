
async function fetchAcademicVaultResources() {
  const container = document.getElementById("academicVaultContainer");
  const uploadsCount = document.getElementById("academicUploadsCount");

  try {
    const { data, error } = await window.db
      .from("academic_resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allAcademicResources = data || [];

    if (uploadsCount) {
      uploadsCount.textContent = allAcademicResources.length;
    }

    updateTotalActiveCounter();
    renderAcademicVault(allAcademicResources.slice(0, 3));
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
  resources.forEach((item) => {
    const row = document.createElement("div");
    row.className = "preview-row";
    row.style.cursor = "pointer";
    row.style.transition = "background 0.2s ease";
    row.title = "Click to download resource";

    const courseCode = item.course_code
      ? ` • ${item.course_code.toUpperCase()}`
      : "";
    const uploader = item.uploaded_by || "Anonymous";

    row.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; opacity: 0.8;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>
      <div class="file-info" style="flex: 1; overflow: hidden;">
        <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(item.department)}${escapeHTML(courseCode)} | By ${escapeHTML(uploader)}</small>
      </div>
      <button onclick="downloadAcademicFile('${item.file_url}', '${escapeHTML(item.title)}')" class="btn-primary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; border-radius: 8px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      </button>
    `;

    row.addEventListener(
      "mouseover",
      () => (row.style.background = "rgba(255, 255, 255, 0.1)"),
    );
    row.addEventListener(
      "mouseout",
      () => (row.style.background = "rgba(255, 255, 255, 0.04)"),
    );

    container.appendChild(row);
  });
}

function filterAcademicVault(department) {
  const headerTitle = document.getElementById("vaultHeaderTitle");
  if (headerTitle)
    headerTitle.textContent = department.toLowerCase().replace(/\s+/g, "_");

  const filtered = allAcademicResources.filter(
    (item) => item.department === department,
  );
  renderAcademicVault(filtered.slice(0, 3));
}

function downloadAcademicFile(fileUrl, filename) {
  if (!fileUrl) {
    alert("File URL not found.");
    return;
  }

  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = filename || "academic_document";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
