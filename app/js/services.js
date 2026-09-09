document.addEventListener("DOMContentLoaded", () => {
  loadServicesGallery();
});

async function loadServicesGallery() {
  const container = document.getElementById("servicesGalleryContainer");
  if (!container) return;

  try {
    const { data, error } = await window.db
      .from("listings")
      .select("*")
      .in("category", [
        "airtel_money",
        "tnm_mpamba",
        "expert",
        "service",
        "tailor",
        "repair",
      ])
      .order("created_at", { ascending: false });

    if (error) throw error;

    const items = data || [];

    if (items.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No active services or agents listed yet.</p>`;
      return;
    }

    container.innerHTML = "";

    items.forEach((item) => {
      const card = document.createElement("div");
      const category = (item.category || "").toLowerCase();

      const isAirtel = category.includes("airtel");
      const isTnm = category.includes("tnm");
      const isNetworkAgent = isAirtel || isTnm;

      card.className = isNetworkAgent
        ? `service-card network-agent-card ${
            isAirtel ? "airtel-card" : "tnm-card"
          }`
        : "service-card expert-card";

      const rawImage =
        item.image_path ||
        (isAirtel
          ? "https://images.unsplash.com/photo-1556742049-0a67d553c2a3?auto=format&fit=crop&w=600&q=80"
          : isTnm
          ? "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=600&q=80"
          : "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80");

      const title = escapeHTML(item.title || "Service Provider");
      const code = escapeHTML(item.agent_code || item.code || "N/A");
      const phone = escapeHTML(
        item.contact_number || item.phone_number || item.contact || "+265...",
      );
      const location = escapeHTML(
        item.location_details || item.location || "Domasi Campus",
      );

      const rawPhoneClean = phone.replace(/[^0-9+]/g, "");
      const whatsappUrl = `https://wa.me/${rawPhoneClean}?text=Hello%2C%20I%20saw%20your%20listing%20for%20${encodeURIComponent(
        title,
      )}%20on%20Domasi%20Hub.`;

      if (isNetworkAgent) {
        card.innerHTML = `
          <div class="agent-badge-header">
            <span>${isAirtel ? "Airtel Money Agent" : "TNM Mpamba Agent"}</span>
          </div>
          <div class="agent-img-frame">
            <img src="${rawImage}" alt="${title}" loading="lazy">
          </div>
          <div class="agent-details">
            <h3>${title}</h3>
            <div class="agent-meta-grid">
              <div><strong>Agent Code:</strong> ${code}</div>
              <div><strong>Phone:</strong> ${phone}</div>
              <div class="full-span"><strong>Location:</strong> ${location}</div>
            </div>
          </div>
          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="whatsapp-contact-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Contact Owner via WhatsApp
          </a>
        `;
      } else {
        card.innerHTML = `
          <div class="expert-img-frame">
            <img src="${rawImage}" alt="${title}" loading="lazy">
          </div>
          <div class="expert-details">
            <h3>${title}</h3>
            <p class="expert-desc">${escapeHTML(
              item.description ||
                "Professional campus service and craft work available on demand.",
            )}</p>
            <div class="expert-meta">
              <span>📍 ${location}</span>
              <span>📞 ${phone}</span>
            </div>
          </div>
          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="whatsapp-contact-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Contact Owner via WhatsApp
          </a>
        `;
      }

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading services gallery:", err);
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 3rem;">Failed to load services gallery.</p>`;
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
