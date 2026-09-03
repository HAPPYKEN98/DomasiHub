import { supabase } from "./lib/supabase.js";
import { escapeHTML } from "./lib/security.js";
import { money, schemaHint, param, searchTerm } from "./lib/format.js";

const grid = document.querySelector("#marketGrid");
const status = document.querySelector("#marketStatus");
const search = document.querySelector("#marketSearch");

const q = param("q");

if (search && q) {
  search.value = q;
}

async function loadPublicProfiles(ids) {
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("public_profiles")
    .select("id,full_name,avatar_url,verified")
    .in("id", ids);

  if (error) {
    console.error("Profile loading failed:", error);
    return new Map();
  }

  return new Map((data || []).map((profile) => [profile.id, profile]));
}

function card(item, profile) {
  const images = Array.isArray(item.image_urls)
    ? item.image_urls
    : item.image_url
      ? [item.image_url]
      : [];

  const image = images[0];

  const seller = profile?.full_name || "Domasi student";

  return `
    <article class="card listing-card">

      ${
        image
          ? `
            <a
              href="marketplace-detail.html?id=${encodeURIComponent(item.id)}"
              class="card-media"
              aria-label="View ${escapeHTML(item.title)}"
            >
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(item.title)}"
                loading="lazy"
              >
            </a>
          `
          : `
            <a
              href="marketplace-detail.html?id=${encodeURIComponent(item.id)}"
              class="card-media card-media-empty"
              aria-label="View ${escapeHTML(item.title)}"
            >
              <span>No photo</span>
            </a>
          `
      }

      <div class="card-content">

        <div class="row">
          <span class="chip">
            ${escapeHTML(item.category || "General")}
          </span>

          <span class="price">
            ${money(item.price)}
          </span>
        </div>

        <h3>
          <a href="marketplace-detail.html?id=${encodeURIComponent(item.id)}">
            ${escapeHTML(item.title || "Untitled listing")}
          </a>
        </h3>

        ${
          item.item_condition
            ? `
              <p class="detail-line">
                Condition:
                <strong>
                  ${escapeHTML(item.item_condition)}
                </strong>
              </p>
            `
            : ""
        }

        ${
          item.location_details
            ? `
              <p class="detail-line">
                ${escapeHTML(item.location_details)}
              </p>
            `
            : ""
        }

        ${
          item.description
            ? `
              <p class="description listing-description">
                ${escapeHTML(item.description)}
              </p>
            `
            : ""
        }

        <div class="uploader">

          <span class="avatar">
            ${escapeHTML(seller.charAt(0).toUpperCase())}
          </span>

          <span>
            Listed by
            <strong>
              ${escapeHTML(seller)}
            </strong>
          </span>

        </div>

        <a
          class="btn btn-secondary"
          href="marketplace-detail.html?id=${encodeURIComponent(item.id)}"
        >
          View listing
        </a>

      </div>
    </article>
  `;
}

async function load() {
  if (!grid) return;

  status.textContent = "Loading listings...";

  let query = supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", {
      ascending: false,
    })
    .limit(48);

  const term = searchTerm(search?.value);

  if (term) {
    query = query.or(
      [
        `title.ilike.%${term}%`,
        `category.ilike.%${term}%`,
        `location_details.ilike.%${term}%`,
        `description.ilike.%${term}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);

    status.textContent = schemaHint(error);

    grid.innerHTML = "";

    return;
  }

  if (!data?.length) {
    status.textContent = term
      ? "No listings match your search."
      : "No listings yet. Be the first to post something.";

    grid.innerHTML = `
      <div class="empty">
        <strong>No listings found</strong>
        <p>
          ${
            term
              ? "Try another search."
              : "Your first listing could appear here."
          }
        </p>
      </div>
    `;

    return;
  }

  const ids = [...new Set(data.map((item) => item.posted_by).filter(Boolean))];

  const profiles = await loadPublicProfiles(ids);

  status.textContent = `${data.length} listing${data.length === 1 ? "" : "s"}`;

  grid.innerHTML = data
    .map((item) => card(item, profiles.get(item.posted_by)))
    .join("");
}

search?.addEventListener("input", () => {
  clearTimeout(search._timer);

  search._timer = setTimeout(load, 250);
});

document.querySelector(`[data-focus-search="marketSearch"]`)?.addEventListener("click", () => { search?.dispatchEvent(new Event("input", {bubbles:true})); });

load();
