const API_URL = window.location.hostname.includes('localhost') 
    ? 'http://localhost:3000' 
    : 'https://domasi-hub-production.up.railway.app';

document.addEventListener("DOMContentLoaded", () => {
    const navWrapper = document.getElementById("portalNavWrapper");
    if (navWrapper) {
        if (localStorage.getItem('isLoggedIn') === 'true') {
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

    try {
        const response = await fetch(`${API_URL}/api/listings?category=printing`);
        const data = await response.json();

        if (data.status === "success" && data.listings && data.listings.length > 0) {
            grid.innerHTML = ""; 
            data.listings.forEach(item => {
                const card = document.createElement("div");
                card.className = "printer-card active";
                card.style.cssText = "background: var(--bg-surface); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-subtle);";

                const priceFormatted = "MWK " + parseFloat(item.price || 0).toLocaleString();
                const cleanPhone = item.contact_number ? item.contact_number.replace(/[^0-9]/g, "") : "";
                const imageSrc = item.image_path || "https://via.placeholder.com/300x200?text=No+Image";

                card.innerHTML = `
                    <div style="background: rgba(0, 0, 0, 0.03); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 4px;">
                        <img src="${imageSrc}" alt="${item.title || 'Printer Station'}" style="width:100%; height:200px; object-fit:contain; border-radius:4px; display:block;">
                    </div>
                    <div class="product-info" style="margin-top:1rem;">
                        <h3>${item.title || 'Untitled Station'}</h3>
                        <p style="font-size:0.9rem; margin:0.3rem 0; color:var(--text-secondary);">📍 Location: ${item.location_details || 'N/A'}</p>
                        <p class="price" style="font-weight:bold; color:var(--primary-color); margin:0.5rem 0;">Rate: ${priceFormatted} / page</p>
                        <a href="https://wa.me/${cleanPhone}?text=Hi,%20I'm%20interested%20in%20sending%20a%20print%20job%20to%20${encodeURIComponent(item.title || '')}" target="_blank" class="btn-primary" style="display:block; text-align:center; text-decoration:none; padding:0.6rem; border-radius:6px; background:var(--primary-color); color:white;">Send Document</a>
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