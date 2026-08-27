import { supabase } from "./lib/supabase.js";
import { escapeHTML } from "./lib/security.js";
import { waLink } from "./lib/format.js";

const grid = document.querySelector("#printingGrid");

const status = document.querySelector("#printingStatus");

const search = document.querySelector("#printingSearch");

function card(provider) {
  const image = provider.image_urls?.[0];

  const wa = waLink(
    provider.contact_number,
    `Hi, I found your printing station on Domasi Hub.`,
  );

  return `
        <article class="card">

            ${
              image
                ? `
                        <div class="card-media">
                            <img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(provider.name)}"
                            >
                        </div>
                    `
                : ""
            }


            <div class="card-content">

                <div class="row">

                    <span class="chip">
                        ${provider.available ? "Open" : "Unavailable"}
                    </span>

                </div>


                <h3>
                    ${escapeHTML(provider.name)}
                </h3>


                <p class="muted">
                    ${escapeHTML(provider.location_details || "Domasi")}
                </p>


                ${
                  provider.notes
                    ? `
                            <p class="description">
                                ${escapeHTML(provider.notes)}
                            </p>
                        `
                    : ""
                }


                <div class="uploader">

                    <span class="avatar">
                        ${escapeHTML(
                          (provider.profiles?.full_name || "Student")
                            .charAt(0)
                            .toUpperCase(),
                        )}
                    </span>

                    <span>
                        Operated by
                        <strong>
                            ${escapeHTML(
                              provider.profiles?.full_name || "Student",
                            )}
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
    .select(
      `
                *,
                profiles:owner_id (
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
      `name.ilike.%${term}%,location_details.ilike.%${term}%,notes.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);

    status.textContent = "Unable to load printing stations.";

    return;
  }

  if (!data?.length) {
    status.textContent = "No printing stations registered yet.";

    grid.innerHTML = `
            <div class="empty">
                No printing stations are available yet.
            </div>
        `;

    return;
  }

  status.textContent = `${data.length} printing station${
    data.length === 1 ? "" : "s"
  }`;

  grid.innerHTML = data.map(card).join("");
}

search?.addEventListener("input", () => {
  clearTimeout(search._timer);

  search._timer = setTimeout(load, 250);
});

load();
