document.addEventListener("DOMContentLoaded", () => {
  loadExplorePreviews();
});

async function loadExplorePreviews() {
  const academicCard = document.getElementById("recent-academic-card");
  const accommodationCard = document.getElementById(
    "recent-accommodation-card",
  );
  const printerCard = document.getElementById("printer-station-card");
  const marketplaceCard = document.getElementById("marketplace-card");

  try {
    const [academicRes, listingsRes] = await Promise.all([
      window.db
        .from("academic_resources")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      window.db
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (academicRes.error) throw academicRes.error;
    if (listingsRes.error) throw listingsRes.error;

    // 1. Populate Academic Preview
    if (academicCard && academicRes.data) {
      const item = academicRes.data;
      academicCard.innerHTML = `
        <span class="explore-badge academic-badge">Academic Repository</span>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.department)} ${
        item.course_code
          ? "• " + escapeHTML(item.course_code.toUpperCase())
          : ""
      }</p>
      `;
    }

    const listings = listingsRes.data || [];

    // 2. Populate Accommodation Preview
    const latestAccom = listings.find(
      (item) => item.category === "accommodation",
    );
    if (accommodationCard && latestAccom) {
      accommodationCard.innerHTML = `
        <span class="explore-badge accommodation-badge">Hostel Listings</span>
        <h3>${escapeHTML(latestAccom.title)}</h3>
        <p>${escapeHTML(
          latestAccom.location_details ||
            latestAccom.item_condition ||
            "Verified off-campus rental",
        )}</p>
      `;
    }

    // 3. Populate Printer Preview (with image frame support)
    const latestPrint = listings.find((item) => item.category === "printing");
    if (printerCard && latestPrint) {
      const printImage =
        latestPrint.image_path ||
        "https://via.placeholder.com/300x200?text=Printer+Station";
      printerCard.innerHTML = `
        <span class="explore-badge printer-badge">Printing Station Hub</span>
        <h3>${escapeHTML(latestPrint.title)}</h3>
        <div style="background: rgba(0, 0, 0, 0.03); border-radius: 8px; border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); overflow: hidden; padding: 4px; margin: 0.5rem 0;">
          <img src="${printImage}" alt="${escapeHTML(
        latestPrint.title,
      )}" style="width:100%; height:120px; object-fit:cover; border-radius:6px; display:block;">
        </div>
        <p>${escapeHTML(
          latestPrint.location_details || "Active print terminal",
        )}</p>
      `;
    }

    // 4. Populate Marketplace Preview
    const latestMarket = listings.find(
      (item) => item.category === "marketplace",
    );
    if (marketplaceCard && latestMarket) {
      marketplaceCard.innerHTML = `
        <span class="explore-badge marketplace-badge">Campus Marketplace</span>
        <h3>${escapeHTML(latestMarket.title)}</h3>
        <p>MWK ${parseFloat(
          latestMarket.price || 0,
        ).toLocaleString()} • ${escapeHTML(
        latestMarket.item_condition || "Essential item",
      )}</p>
      `;
    }
  } catch (err) {
    console.error("Failed to load explore previews:", err);
  }
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
