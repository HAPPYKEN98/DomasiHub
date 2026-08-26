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

    loadMarketplace();
});

function formatTitle(title) {
    if (!title) return 'Untitled Item';
    return title
        .split(' ')
        .map(word => {
            const lower = word.toLowerCase();
            if (lower === 'hp') return 'HP';
            if (lower === 'pc') return 'PC';
            if (lower === 'probook') return 'ProBook';
            if (lower === 'elitebook') return 'EliteBook';
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

function cleanConditionText(conditionStr) {
    if (!conditionStr) return 'N/A';
    return conditionStr.replace(/condition/gi, '').trim();
}

async function loadMarketplace() {
    const grid = document.getElementById("marketplace-grid");
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/api/listings?category=marketplace`);
        const data = await response.json();

        if (data.status === "success" && data.listings && data.listings.length > 0) {
            grid.innerHTML = ""; 
            data.listings.forEach(item => {
                const card = document.createElement("div");
                card.className = "product-card";

                const titleClean = formatTitle(item.title);
                const conditionClean = cleanConditionText(item.item_condition);
                
                const priceFormatted = "MWK " + parseFloat(item.price || 0).toLocaleString();
                const cleanPhone = item.contact_number ? item.contact_number.replace(/[^0-9]/g, "") : "";
                const imageSrc = item.image_path || "https://via.placeholder.com/300x200?text=No+Image";

                card.innerHTML = `
                    <div class="product-image" style="background: rgba(0, 0, 0, 0.03); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 4px;">
                        <img src="${imageSrc}" alt="${titleClean}" style="width:100%; height:200px; object-fit:contain; border-radius:4px; display:block;">
                    </div>
                    <div class="product-info" style="margin-top:0.75rem;">
                        <h3 style="margin: 0.2rem 0;">${titleClean}</h3>
                        <p class="condition" style="font-size:0.85rem; color:var(--text-secondary); margin:0.2rem 0;">Condition: ${conditionClean}</p>
                        <p class="price" style="font-weight:bold; color:var(--primary-color); margin:0.4rem 0;">${priceFormatted}</p>
                        <a href="https://wa.me/${cleanPhone}?text=Hi,%20I'm%20interested%20in%20your%20listing:%20${encodeURIComponent(titleClean)}%20on%20Domasi%20Hub" target="_blank" class="btn-primary btn-marketplace" style="display:block; text-align:center; text-decoration:none; margin-top:0.75rem; padding:0.6rem;">Chat on WhatsApp</a>
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