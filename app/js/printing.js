import { supabase } from "./lib/supabase.js";
import { escapeHTML } from "./lib/security.js";
import { waLink } from "./lib/format.js";

const grid = document.querySelector("#printingGrid");

const status = document.querySelector("#printingStatus");

const search = document.querySelector("#printingSearch");

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

function card(provider, profile) {
  const images = Array.isArray(provider.image_urls) ? provider.image_urls : [];

  const image = images[0];

  const operator = profile?.full_name || "Domasi student";

  const wa = waLink(
    provider.contact_number,
    `Hi, I found "${provider.name}" on Domasi Hub and would like to enquire about printing.`,
  );

  return `
    <article class="card listing-card">

      ${
        image
          ? `
            <div class="card-media">
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(provider.name)}"
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

          <span class="chip ${
            provider.available ? "status-positive" : "status-negative"
          }">
            ${provider.available ? "Open" : "Unavailable"}
          </span>

        </div>

        <h3>
          ${escapeHTML(provider.name)}
        </h3>

        ${
          provider.location_details
            ? `
              <p class="detail-line">
                ${escapeHTML(provider.location_details)}
              </p>
            `
            : ""
        }

        ${
          provider.notes
            ? `
              <p class="description listing-description">
                ${escapeHTML(provider.notes)}
              </p>
            `
            : ""
        }

        <div class="uploader">

          <span class="avatar">
            ${escapeHTML(operator.charAt(0).toUpperCase())}
          </span>

          <span>
            Operated by
            <strong>
              ${escapeHTML(operator)}
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
                Contact station
              </a>
            `
            : ""
        }

      </div>

    </article>
  `;
}

async function load() {
  status.textContent = "Loading printing stations...";

  let query = supabase
    .from("printing_providers")
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
        `name.ilike.%${term}%`,
        `location_details.ilike.%${term}%`,
        `notes.ilike.%${term}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);

    status.textContent = "Unable to load printing stations.";

    grid.innerHTML = "";

    return;
  }

  if (!data?.length) {
    status.textContent = "No printing stations registered yet.";

    grid.innerHTML = `
      <div class="empty">
        <strong>No printing stations yet</strong>
        <p>
          Be the first student to register a station.
        </p>
      </div>
    `;

    return;
  }

  const ids = [...new Set(data.map((item) => item.owner_id).filter(Boolean))];

  const profiles = await loadProfiles(ids);

  status.textContent = `${data.length} printing station${
    data.length === 1 ? "" : "s"
  }`;

  grid.innerHTML = data
    .map((item) => card(item, profiles.get(item.owner_id)))
    .join("");
}

search?.addEventListener("input", () => {
  clearTimeout(search._timer);

  search._timer = setTimeout(load, 250);
});

load();
