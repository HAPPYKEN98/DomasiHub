document.addEventListener("DOMContentLoaded", () => {
  const navWrapper = document.getElementById("portalNavWrapper");
  if (navWrapper) {
    if (localStorage.getItem("isLoggedIn") === "true") {
      navWrapper.innerHTML = `<a href="portal.html" class="btn-secondary">Go to Portal</a>`;
    } else {
      navWrapper.innerHTML = `<a href="signin.html" class="btn-nav-signin">Sign In</a>`;
    }
  }

  loadMarketplace();
});

function sanitizeMalawianWhatsApp(rawNumber) {
  if (!rawNumber) return "";
  let cleaned = rawNumber.trim().replace(/[\s()-]/g, "");
  if (cleaned.startsWith("+265")) return cleaned.replace("+", "");
  if (cleaned.startsWith("265") && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 10)
    return "265" + cleaned.substring(1);
  if (cleaned.length === 9) return "265" + cleaned;
  return cleaned;
}

function formatTitle(title) {
  if (!title) return "Untitled Item";
  return title
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "hp") return "HP";
      if (lower === "pc") return "PC";
      if (lower === "probook") return "ProBook";
      if (lower === "elitebook") return "EliteBook";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function cleanConditionText(conditionStr) {
  if (!conditionStr) return "N/A";
  return conditionStr.replace(/condition/gi, "").trim();
}

async function loadMarketplace() {
  const grid = document.getElementById("marketplace-grid");
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
      .eq("category", "marketplace");

    if (error) throw error;

    if (listings && listings.length > 0) {
      grid.innerHTML = "";
      listings.forEach((item) => {
        const card = document.createElement("div");
        card.className = "product-card";

        const titleClean = formatTitle(item.title);
        const conditionClean = cleanConditionText(item.item_condition);

        const priceFormatted =
          "MWK " + parseFloat(item.price || 0).toLocaleString();
        const cleanPhone = sanitizeMalawianWhatsApp(item.contact_number);
        const imageSrc =
          item.image_path ||
          "https://via.placeholder.com/300x200?text=No+Image";

        const whatsappMessage = encodeURIComponent(
          `Hello, I'm interested in the item [${titleClean}] that you posted on Domasi Hub`,
        );

        card.innerHTML = `
                    <div class="product-image" style="background: rgba(0, 0, 0, 0.03); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 4px;">
                        <img src="${imageSrc}" alt="${titleClean}" style="width:100%; height:200px; object-fit:contain; border-radius:4px; display:block;">
                    </div>
                    <div class="product-info" style="margin-top:0.75rem;">
                        <h3 style="margin: 0.2rem 0;">${titleClean}</h3>
                        <p class="condition" style="font-size:0.85rem; color:var(--text-secondary); margin:0.2rem 0;">Condition: ${conditionClean}</p>
                        <p class="price" style="font-weight:bold; color:var(--primary-color); margin:0.4rem 0;">${priceFormatted}</p>
                        <a href="https://wa.me/${cleanPhone}?text=${whatsappMessage}" target="_blank" class="btn-primary btn-marketplace" style="display:block; text-align:center; text-decoration:none; margin-top:0.75rem; padding:0.6rem;">Chat on WhatsApp</a>
                    </div>
                `;
        grid.appendChild(card);
      });
    } else {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No items listed yet.</p>`;
    }
  } catch (error) {
    console.error("Failed to load listings:", error);
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: red;">Failed to load marketplace data.</p>`;
  }
}
