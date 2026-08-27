import { supabase } from "./lib/supabase.js";

import { escapeHTML } from "./lib/security.js";

import { money, param, waLink } from "./lib/format.js";

const grid = document.querySelector("#marketGrid");

const status = document.querySelector("#marketStatus");

const search = document.querySelector("#marketSearch");

const q = param("q");

if (search && q) {
  search.value = q;
}

function card(item) {
  const images = item.image_urls || [];

  const image = images[0];

  const wa = waLink(
    item.contact_number,
    `Hi, I'm interested in "${item.title}" on Domasi Hub.`,
  );

  const seller = item.profiles?.full_name || "Student";

  return `

        <article class="card">

            ${
              image
                ? `
                        <a
                            class="card-media"
                            href="marketplace-detail.html?id=${encodeURIComponent(item.id)}"
                        >
                            <img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(item.title)}"
                            >
                        </a>
                    `
                : ""
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
                    ${escapeHTML(item.title)}
                </h3>


                <p class="muted">
                    ${escapeHTML(item.location_details || "Domasi")}
                </p>


                ${
                  item.item_condition
                    ? `
                            <p class="detail-line">
                                ${escapeHTML(item.item_condition)}
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
                        ${escapeHTML(seller.charAt(0).toUpperCase())}
                    </span>

                    <span>
                        Listed by
                        <strong>
                            ${escapeHTML(seller)}
                        </strong>
                    </span>

                </div>


                <div class="actions">

                    <a
                        class="btn btn-secondary"
                        href="marketplace-detail.html?id=${encodeURIComponent(item.id)}"
                    >
                        View details
                    </a>

                    ${
                      wa
                        ? `
                                <a
                                    class="btn btn-primary"
                                    href="${escapeHTML(wa)}"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    WhatsApp
                                </a>
                            `
                        : ""
                    }

                </div>

            </div>

        </article>
    `;
}

async function load() {
  status.textContent = "Loading listings...";

  let query = supabase
    .from("listings")
    .select(
      `
                *,
                profiles:posted_by (
                    full_name,
                    reg_number
                )
            `,
    )
    .eq("status", "active")
    .order("created_at", {
      ascending: false,
    })
    .limit(48);

  const term = search?.value
    ?.trim()
    .replace(/[%(),]/g, "")
    .slice(0, 80);

  if (term) {
    query = query.or(
      `title.ilike.%${term}%,category.ilike.%${term}%,location_details.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);

    status.textContent = "Unable to load marketplace listings.";

    grid.innerHTML = "";

    return;
  }

  if (!data?.length) {
    status.textContent = term
      ? "No listings match your search."
      : "No listings yet. Be the first to post something.";

    grid.innerHTML = `
            <div class="empty">
                ${
                  term
                    ? "Try another search."
                    : "There are no active listings yet."
                }
            </div>
        `;

    return;
  }

  status.textContent = `${data.length} listing${data.length === 1 ? "" : "s"}`;

  grid.innerHTML = data.map(card).join("");
}

search?.addEventListener("input", () => {
  clearTimeout(search._timer);

  search._timer = setTimeout(load, 220);
});

load();
