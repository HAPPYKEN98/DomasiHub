import { supabase } from "./lib/supabase.js";
import { escapeHTML } from "./lib/security.js";
import { money, waLink } from "./lib/format.js";

const grid = document.querySelector("#housingGrid");

const status = document.querySelector("#housingStatus");

const search = document.querySelector("#housingSearch");

const availability = document.querySelector("#housingAvailability");

function card(item) {
  const image = item.image_urls?.[0];

  const wa = waLink(
    item.contact_number,
    `Hi, I'm interested in "${item.title}" on Domasi Hub.`,
  );

  return `
        <article class="card">

            ${
              image
                ? `
                        <div class="card-media">
                            <img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(item.title)}"
                            >
                        </div>
                    `
                : ""
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
                    ${escapeHTML(item.title)}
                </h3>


                <p class="muted">
                    ${escapeHTML(item.location_details)}
                </p>


                ${
                  item.utilities
                    ? `
                            <p class="detail-line">
                                ${escapeHTML(item.utilities)}
                            </p>
                        `
                    : ""
                }


                ${
                  item.security_notes
                    ? `
                            <p class="detail-line">
                                ${escapeHTML(item.security_notes)}
                            </p>
                        `
                    : ""
                }


                ${
                  item.description
                    ? `
                            <p class="description">
                                ${escapeHTML(item.description)}
                            </p>
                        `
                    : ""
                }


                <div class="uploader">

                    <span class="avatar">
                        ${escapeHTML(
                          (item.profiles?.full_name || "Student")
                            .charAt(0)
                            .toUpperCase(),
                        )}
                    </span>

                    <span>
                        Listed by
                        <strong>
                            ${escapeHTML(item.profiles?.full_name || "Student")}
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
                                rel="noopener"
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
    .select(
      `
                *,
                profiles:posted_by (
                    full_name
                )
            `,
    )
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
      `title.ilike.%${term}%,location_details.ilike.%${term}%,utilities.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }

  if (availability?.value) {
    query = query.eq("available", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);

    status.textContent = "Unable to load accommodation right now.";

    grid.innerHTML = "";

    return;
  }

  if (!data?.length) {
    status.textContent = "No accommodation found.";

    grid.innerHTML = `
            <div class="empty">
                No accommodation listings match your search.
            </div>
        `;

    return;
  }

  status.textContent = `${data.length} accommodation listing${
    data.length === 1 ? "" : "s"
  }`;

  grid.innerHTML = data.map(card).join("");
}

search?.addEventListener("input", () => {
  clearTimeout(search._timer);

  search._timer = setTimeout(load, 250);
});

availability?.addEventListener("change", load);

load();
