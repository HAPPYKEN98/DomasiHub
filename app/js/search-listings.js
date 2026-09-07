let allListings = [];
let allAcademicResources = [];

async function loadHomepageData() {
  const featuredGrid = document.getElementById("featured-grid");

  try {
    // Fetch both listings and academic resources concurrently
    const [listingsRes, academicRes] = await Promise.all([
      window.db
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false }),
      window.db
        .from("academic_resources")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (listingsRes.error) throw listingsRes.error;
    if (academicRes.error) throw academicRes.error;

    allListings = listingsRes.data || [];
    allAcademicResources = academicRes.data || [];

    const formatCount = (count, singular, plural) =>
      `${count} ${count === 1 ? singular : plural}`;

    const marketCount = allListings.filter(
      (item) => item.category === "marketplace",
    ).length;
    const printCount = allListings.filter(
      (item) => item.category === "printing",
    ).length;
    const roomCount = allListings.filter(
      (item) => item.category === "accommodation",
    ).length;

    updateTotalActiveCounter();

    if (document.getElementById("marketplaceCount"))
      document.getElementById("marketplaceCount").textContent = formatCount(
        marketCount,
        "item",
        "items",
      );
    if (document.getElementById("printingCount"))
      document.getElementById("printingCount").textContent = formatCount(
        printCount,
        "station",
        "stations",
      );
    if (document.getElementById("accommodationCount"))
      document.getElementById("accommodationCount").textContent = formatCount(
        roomCount,
        "unit",
        "units",
      );

    // Select a blend for the featured grid (e.g., up to 2 listings and 1 academic resource)
    const featuredListings = allListings.slice(0, 2);
    const featuredAcademics = allAcademicResources.slice(0, 1);

    renderSearchResults(featuredListings, featuredAcademics, false);
  } catch (error) {
    console.error("Failed to load portal data for home page:", error);
    if (featuredGrid) {
      featuredGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: red;">Failed to load dynamic listings.</p>`;
    }
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

  const queryNoSpaces = query.replace(/\s+/g, "");
  const filteredListings = allListings.filter((item) => {
    const titleMatch = (item.title || "").toLowerCase().includes(query);
    const locationMatch = (item.location_details || "")
      .toLowerCase()
      .includes(query);
    const conditionMatch = (
      item.item_condition ||
      item.security_condition ||
      ""
    )
      .toLowerCase()
      .includes(query);
    const categoryMatch = (item.category || "").toLowerCase().includes(query);
    return titleMatch || locationMatch || conditionMatch || categoryMatch;
  });

  const filteredAcademics = allAcademicResources.filter((item) => {
    const titleMatch = (item.title || "").toLowerCase().includes(query);
    const deptMatch = (item.department || "").toLowerCase().includes(query);
    const rawCode = (item.course_code || "").toLowerCase();
    const codeMatch =
      rawCode.includes(query) ||
      rawCode.replace(/\s+/g, "").includes(queryNoSpaces);
    return titleMatch || deptMatch || codeMatch;
  });

  renderSearchResults(filteredListings, filteredAcademics, true, rawQuery);
  renderAcademicVault(filteredAcademics.slice(0, 3));
}

function renderSearchResults(
  listingsItems = [],
  academicItems = [],
  isSearchResult = false,
  query = "",
) {
  const featuredGrid = document.getElementById("featured-grid");
  const featuredTitle = document.getElementById("featuredTitle");
  const featuredSubtitle = document.getElementById("featuredSubtitle");
  const clearBtn = document.getElementById("clearSearchBtn");

  if (!featuredGrid) return;

  const totalResultsCount = listingsItems.length + academicItems.length;

  if (isSearchResult) {
    if (featuredTitle)
      featuredTitle.textContent = `Search Results (${totalResultsCount})`;
    if (featuredSubtitle)
      featuredSubtitle.textContent = `Results matching "${query}"`;
    if (clearBtn) {
      clearBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Clear`;
      clearBtn.style.display = "inline-flex";
      clearBtn.style.alignItems = "center";
      clearBtn.style.gap = "4px";
      clearBtn.style.color = "var(--text-core, #1f2937)";
      clearBtn.style.backgroundColor = "var(--bg-surface, #f3f4f6)";
      clearBtn.style.border = "1px solid var(--border-subtle, #d1d5db)";
      clearBtn.style.padding = "0.4rem 0.7rem";
      clearBtn.style.fontSize = "0.85rem";
      clearBtn.style.whiteSpace = "nowrap";
      clearBtn.style.flexShrink = "0";
      clearBtn.style.borderRadius = "6px";
    }
  } else {
    if (featuredTitle) featuredTitle.textContent = "LATEST UPDATES";
    if (featuredSubtitle)
      featuredSubtitle.textContent =
        "Trending listings and active services available today.";
    if (clearBtn) clearBtn.style.display = "none";
  }

  if (totalResultsCount > 0) {
    featuredGrid.innerHTML = "";

    academicItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "module-card";
      card.style.borderColor = "rgba(16, 185, 129, 0.4)";

      const courseCode = item.course_code
        ? item.course_code.toUpperCase()
        : "MODULE";
      const uploader = item.uploaded_by || "Anonymous";

      card.innerHTML = `
        <div>
          <span class="featured-badge" style="background: linear-gradient(135deg, #10b981, #059669); display:inline-block; margin-bottom: 0.5rem;">
            Academic Resource
          </span>
          <h4 style="margin: 0 0 0.5rem 0;">${escapeHTML(item.title)}</h4>
        </div>
        <div style="background: rgba(16, 185, 129, 0.08); border-radius: 8px; border: 1px dashed rgba(16, 185, 129, 0.3); padding: 1.2rem; text-align: center;">
          <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-core);">${escapeHTML(courseCode)}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHTML(item.department)}</div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Uploaded by: <strong>${escapeHTML(uploader)}</strong>
        </p>
        <button onclick="downloadAcademicFile('${item.file_url}', '${escapeHTML(item.title)}')" class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); text-align: center; margin-top: auto; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Resource
        </button>
      `;
      featuredGrid.appendChild(card);
    });

    listingsItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "module-card";

      const priceFormatted =
        "MWK " + parseFloat(item.price || 0).toLocaleString();
      const imageSrc =
        item.image_path || "https://via.placeholder.com/300x200?text=No+Image";

      let badgeText = "New Upload";
      let targetPage = "marketplace.html";
      let buttonLabel = "View Item";

      if (item.category === "printing") {
        badgeText = "Print Station";
        targetPage = "printing.html";
        buttonLabel = "View Station";
      } else if (item.category === "accommodation") {
        badgeText = "New Room";
        targetPage = "accommodation.html";
        buttonLabel = "View Room";
      } else if (item.category === "marketplace") {
        badgeText = "New Item";
        targetPage = "marketplace.html";
        buttonLabel = "View in Market";
      }

      card.innerHTML = `
        <div>
          <span class="featured-badge" style="display:inline-block; margin-bottom: 0.5rem;">${badgeText}</span>
          <h4 style="margin: 0 0 0.5rem 0;">${escapeHTML(item.title) || "Untitled Listing"}</h4>
        </div>
        <div style="background: rgba(0, 0, 0, 0.03); border-radius: 8px; border: 1px solid var(--border-subtle); overflow: hidden; padding: 4px;">
          <img src="${imageSrc}" alt="${escapeHTML(item.title) || "Listing"}" style="width:100%; height:160px; object-fit:contain; border-radius:6px; display:block;">
        </div>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">
          ${escapeHTML(item.location_details || item.security_condition || item.item_condition) || "Active on Domasi Hub"}
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
  if (!str) return "";
  return String(str).replace(
    /[&<>'"]/g,
    (tag) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        tag
      ] || tag,
  );
}

document.addEventListener("DOMContentLoaded", () => {
  setupAuthNav();
  loadHomepageData();
  fetchAcademicVaultResources();

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
