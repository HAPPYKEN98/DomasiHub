document.addEventListener("DOMContentLoaded", () => {
  const navWrapper = document.getElementById("portalNavWrapper");
  if (navWrapper) {
    if (localStorage.getItem("isLoggedIn") === "true") {
      navWrapper.innerHTML = `<a href="portal.html" class="btn-secondary">Go to Portal</a>`;
    } else {
      navWrapper.innerHTML = `<a href="signin.html" class="btn-nav-signin">Sign In</a>`;
    }
  }

  loadPrinters();
});

async function loadPrinters() {
  const grid = document.getElementById("printing-grid");
  if (!grid) return;

  const client = window.supabaseClient || window.db;
  if (!client) {
    console.error("Supabase client not initialized.");
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: red;">Database client not ready.</p>`;
    return;
  }

  try {
    const { data: listings, error } = await client
      .from("listings")
      .select("*")
      .eq("category", "printing");

    if (error) throw error;

    if (listings && listings.length > 0) {
      grid.innerHTML = "";
      listings.forEach((item) => {
        const card = document.createElement("div");
        card.className = "printer-card active";
        card.style.cssText =
          "background: var(--bg-surface); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-subtle);";

        const priceFormatted =
          "MWK " + parseFloat(item.price || 0).toLocaleString();
        const cleanPhone = item.contact_number
          ? item.contact_number.replace(/[^0-9]/g, "")
          : "";
        const imageSrc =
          item.image_path ||
          "https://via.placeholder.com/300x200?text=No+Image";

        card.innerHTML = `
                    <div style="background: rgba(0, 0, 0, 0.03); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 4px;">
                        <img src="${imageSrc}" alt="${item.title || "Printer Station"}" style="width:100%; height:200px; object-fit:contain; border-radius:4px; display:block;">
                    </div>
                    <div class="product-info" style="margin-top:1rem;">
                        <h3 style="margin: 0 0 0.5rem 0;">${item.title || "Untitled Station"}</h3>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; margin: 0.4rem 0; color: var(--text-secondary);">
                            <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: rgba(0, 102, 255, 0.1); color: var(--primary-color); flex-shrink: 0;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            </span>
                            <span>${item.location_details || "N/A"}</span>
                        </div>
                        <p class="price" style="font-weight:bold; color:var(--primary-color); margin:0.75rem 0;">Rate: ${priceFormatted} / page</p>
                        <a href="https://wa.me/${cleanPhone}?text=Hi,%20I'm%20interested%20in%20sending%20a%20print%20job%20to%20${encodeURIComponent(item.title || "")}" target="_blank" class="btn-primary" style="display:block; text-align:center; text-decoration:none; padding:0.6rem; border-radius:6px; background:var(--primary-color); color:white;">Send Document</a>
                    </div>
                `;
        grid.appendChild(card);
      });
    } else {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No printer stations active yet.</p>`;
    }
  } catch (error) {
    console.error("Failed to load printers:", error);
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: red;">Failed to load printing data.</p>`;
  }
}
