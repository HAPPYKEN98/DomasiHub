import { supabase } from "./lib/supabase.js";

import { escapeHTML } from "./lib/security.js";

import { money, param, waLink } from "./lib/format.js";

import { toast } from "./lib/ui.js";

const root = document.querySelector("#listingDetail");

const id = param("id");

async function load() {
  if (!root) {
    return;
  }

  if (!id) {
    root.innerHTML = `
            <div class="empty">
                This listing could not be found.
            </div>
        `;

    return;
  }

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
                *,
                profiles:posted_by (
                    full_name,
                    reg_number,
                    whatsapp_number
                )
            `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);

    root.innerHTML = `
            <div class="empty">
                Unable to load this listing.
            </div>
        `;

    return;
  }

  if (!data) {
    root.innerHTML = `
            <div class="empty">
                This listing is no longer available.
            </div>
        `;

    return;
  }

  const user = (await supabase.auth.getUser()).data.user;

  const isOwner = user && user.id === data.posted_by;

  const images = data.image_urls || [];

  const wa = waLink(
    data.contact_number || data.profiles?.whatsapp_number,
    `Hi, I'm interested in "${data.title}" on Domasi Hub.`,
  );

  root.innerHTML = `

        ${
          images.length
            ? `
                    <div class="detail-gallery">

                        ${images
                          .map(
                            (image) => `
                                    <img
                                        src="${escapeHTML(image)}"
                                        alt="${escapeHTML(data.title)}"
                                    >
                                `,
                          )
                          .join("")}

                    </div>
                `
            : ""
        }


        <section class="card">

            <div class="card-content">

                <div class="row">

                    <span class="chip">
                        ${escapeHTML(data.category || "General")}
                    </span>

                    <span class="price">
                        ${money(data.price)}
                    </span>

                </div>


                <h1>
                    ${escapeHTML(data.title)}
                </h1>


                ${
                  data.item_condition
                    ? `
                            <p class="muted">
                                ${escapeHTML(data.item_condition)}
                            </p>
                        `
                    : ""
                }


                ${
                  data.location_details
                    ? `
                            <p class="muted">
                                ${escapeHTML(data.location_details)}
                            </p>
                        `
                    : ""
                }


                ${
                  data.description
                    ? `
                            <p class="description">
                                ${escapeHTML(data.description)}
                            </p>
                        `
                    : ""
                }


                <div class="uploader">

                    <span class="avatar">
                        ${escapeHTML(
                          (data.profiles?.full_name || "Student")
                            .charAt(0)
                            .toUpperCase(),
                        )}
                    </span>

                    <span>
                        Listed by
                        <strong>
                            ${escapeHTML(data.profiles?.full_name || "Student")}
                        </strong>
                    </span>

                </div>


                <div class="actions">

                    ${
                      wa
                        ? `
                                <a
                                    class="btn btn-primary"
                                    href="${escapeHTML(wa)}"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    Chat on WhatsApp
                                </a>
                            `
                        : ""
                    }


                    ${
                      isOwner
                        ? `
                                <a
                                    class="btn btn-secondary"
                                    href="edit.html?type=marketplace&id=${encodeURIComponent(data.id)}"
                                >
                                    Edit listing
                                </a>

                                <button
                                    class="btn btn-danger"
                                    id="deleteListing"
                                    type="button"
                                >
                                    Delete listing
                                </button>
                            `
                        : ""
                    }

                </div>

            </div>

        </section>
    `;

  document
    .querySelector("#deleteListing")
    ?.addEventListener("click", deleteListing);
}

async function deleteListing() {
  const confirmed = window.confirm("Delete this listing permanently?");

  if (!confirmed) {
    return;
  }

  const { error } = await supabase.from("listings").delete().eq("id", id);

  if (error) {
    toast("The listing could not be deleted.", "error");

    return;
  }

  toast("Your listing has been deleted.", "success");

  setTimeout(() => {
    location.href = "marketplace.html";
  }, 700);
}

load();
