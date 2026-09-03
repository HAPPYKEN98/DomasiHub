import { supabase } from "./lib/supabase.js";
import { escapeHTML } from "./lib/security.js";
import { money, waLink } from "./lib/format.js";

const grid = document.querySelector("#housingGrid");

const status = document.querySelector("#housingStatus");

const search = document.querySelector("#housingSearch");

const availability = document.querySelector("#housingAvailability");

async function loadProfiles(ids) {
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("public_profiles")
    .select("id,full_name,avatar_url,verified")
    .in("id", ids);

  if (error) {
    console.error(error);
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

  const wa = waLink(
    item.contact_number,
    `Hi, I'm interested in "${item.title}" on Domasi Hub.`,
  );

  return `
    <article class="card listing-card">

      ${
        image
          ? `
            <div class="card-media">
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(item.title)}"
                loading="lazy"
              >
            </div>
          `
          : `
            <div class="card-media card-media-empty">
              <span>No photo</span>
            </div>
          `
      }

      <div class="card-content">

        <div class="row">

          <span class="chip">
            ${item.available ? "Available" : "Unavailable"}
          </span>

          <span class="price">
            ${money(item.rent)}
            <small>/ month</small>
          </span>

        </div>

        <h3>
          ${escapeHTML(item.title || "Accommodation")}
        </h3>

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
          item.utilities
            ? `
              <p class="detail-line">
                Utilities:
                ${escapeHTML(item.utilities)}
              </p>
            `
            : ""
        }

        ${
          item.security_notes
            ? `
              <p class="detail-line">
                Security:
                ${escapeHTML(item.security_notes)}
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

        ${
          wa
            ? `
              <a
                class="btn btn-primary"
                href="${escapeHTML(wa)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact on WhatsApp
              </a>
            `
            : ""
        }

      </div>

    </article>
  `;
}

async function load() {
  status.textContent = "Loading accommodation...";

  let query = supabase
    .from("housing")
    .select("*")
    .order("created_at", {
      ascending: false,
    })
    .limit(60);

  const term = search?.value
    ?.trim()
    .replace(/[%(),]/g, "")
    .slice(0, 80);

  if (term) {
    query = query.or(
      [
        `title.ilike.%${term}%`,
        `location_details.ilike.%${term}%`,
        `utilities.ilike.%${term}%`,
        `description.ilike.%${term}%`,
      ].join(","),
    );
  }

  if (availability?.value === "true") {
    query = query.eq("available", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);

    status.textContent = "Unable to load accommodation.";

    grid.innerHTML = "";

    return;
  }

  if (!data?.length) {
    status.textContent = "No accommodation found.";

    grid.innerHTML = `
      <div class="empty">
        <strong>No accommodation found</strong>
        <p>
          Try changing your search or check back later.
        </p>
      </div>
    `;

    return;
  }

  const ids = [...new Set(data.map((item) => item.posted_by).filter(Boolean))];

  const profiles = await loadProfiles(ids);

  status.textContent = `${data.length} accommodation listing${
    data.length === 1 ? "" : "s"
  }`;

  grid.innerHTML = data
    .map((item) => card(item, profiles.get(item.posted_by)))
    .join("");
}

search?.addEventListener("input", () => {
  clearTimeout(search._timer);

  search._timer = setTimeout(load, 250);
});

availability?.addEventListener("change", load);

load();
