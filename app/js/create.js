import { supabase } from "./lib/supabase.js";
import { requireAuth } from "./lib/guard.js";
import { uploadPublicMany } from "./lib/media.js";

import { toast, loading } from "./lib/ui.js";

import { escapeHTML } from "./lib/security.js";

const params = new URLSearchParams(location.search);

let type = params.get("type");
if (type === "accommodation") type = "housing";
const picker = document.querySelector("#createPicker");

const form = document.querySelector("#createForm");

const fields = document.querySelector("#dynamicFields");

const title = document.querySelector("#createTitle");

const description = document.querySelector("#createDescription");

const button = document.querySelector("#createButton");

const images = document.querySelector("#listingImages");

const preview = document.querySelector("#imagePreview");

const counter = document.querySelector("#photoCounter");

let selectedFiles = [];

const configs = {
  marketplace: {
    title: "Create marketplace listing",

    description: "Sell or trade something with another student.",

    table: "listings",

    fields: `
            ${input("title", "Item title", "e.g. Scientific calculator", true)}

            ${select(
              "category",
              "Category",
              [
                "Academic",
                "Electronics",
                "Clothing",
                "Furniture",
                "Food",
                "Other",
              ],
              true,
            )}

            ${input("price", "Price (MWK)", "e.g. 15000", true, "number")}

            ${input(
              "contact_number",
              "WhatsApp number",
              "+265...",
              true,
              "tel",
            )}

            ${select(
              "item_condition",
              "Condition",
              [
                "Brand New",
                "Like New",
                "Slightly Used",
                "Used / Fair Condition",
              ],
              true,
            )}

            ${input(
              "location_details",
              "Location",
              "Where can buyers find you?",
            )}

            ${textarea("description", "Description", "Describe the item...")}
        `,

    success: "Your marketplace listing is live.",

    redirect: "marketplace.html",
  },

  housing: {
    title: "List accommodation",

    description: "Help another student find a place to stay.",

    table: "housing",

    fields: `
            ${input("title", "Accommodation name", "e.g. Chikuse House", true)}

            ${input(
              "location_details",
              "Location",
              "e.g. near Domasi campus",
              true,
            )}

            ${input("rent", "Monthly rent (MWK)", "e.g. 35000", true, "number")}

            ${input(
              "contact_number",
              "Contact / WhatsApp",
              "+265...",
              true,
              "tel",
            )}

            ${input("utilities", "Utilities", "Water, electricity, Wi-Fi...")}

            ${input(
              "security_notes",
              "Security",
              "Describe security arrangements...",
            )}

            ${textarea(
              "description",
              "Description",
              "Describe the accommodation...",
            )}
        `,

    success: "Accommodation has been listed.",

    redirect: "accommodation.html",
  },

  academic: {
    title: "Upload academic resource",

    description: "Share a useful paper, note or study resource.",

    table: "academic_resources",

    fields: `
            ${input("title", "Resource title", "e.g. PHY 210 Past Paper", true)}

            ${select(
              "department",
              "Department",
              [
                "Sciences",
                "Humanities",
                "Social Sciences",
                "Languages & Communication",
              ],
              true,
            )}

            ${input("academic_year", "Academic year", "e.g. Year 2")}

            ${input("course_code", "Course code", "e.g. PHY 210")}

            <div class="field">

                <label for="resourceFile">
                    Document
                </label>

                <input
                    id="resourceFile"
                    name="resourceFile"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                >

            </div>
        `,

    success: "Academic resource uploaded.",

    redirect: "academics.html",
  },

  printing: {
    title: "Register printing station",

    description: "Let students discover your printing setup.",

    table: "printing_providers",

    fields: `
            ${input("name", "Station name", "e.g. Craig Prints", true)}

            ${input(
              "location_details",
              "Location",
              "Where students can find you?",
              true,
            )}

            ${input(
              "contact_number",
              "WhatsApp number",
              "+265...",
              true,
              "tel",
            )}

            ${textarea(
              "notes",
              "Station details",
              "Printing services, opening times, pricing...",
            )}
        `,

    success: "Printing station registered.",

    redirect: "printing.html",
  },

  service: {
    title: "Offer a student service",

    description: "Tell students what you can help them with.",

    table: "skill_services",

    fields: `
            ${input("provider_name", "Your name", "Your name", true)}

            ${input(
              "service_title",
              "Service title",
              "e.g. Graphic design",
              true,
            )}

            ${input("skill_category", "Category", "e.g. Design", true)}

            ${input(
              "contact_number",
              "WhatsApp number",
              "+265...",
              true,
              "tel",
            )}

            ${input(
              "starting_price",
              "Starting price (MWK)",
              "e.g. 5000",
              false,
              "number",
            )}

            ${textarea(
              "description",
              "Description",
              "Describe your service...",
            )}
        `,

    success: "Your student service is now listed.",

    redirect: "services.html",
  },
};

const config = type ? configs[type] : null;

if (!config) {
  if (picker) picker.hidden = false;
  if (form) form.hidden = true;
} else {
  if (picker) picker.hidden = true;
  if (form) form.hidden = false;
}

if (!config) {
  // The picker is the landing state for the global + button.
} else {
title.textContent = config.title;

description.textContent = config.description;

fields.innerHTML = config.fields;

button.textContent = `Publish ${type === "academic" ? "resource" : "listing"}`;

await requireAuth();
}

/* =========================================================
   IMAGE SELECTION
========================================================= */

images?.addEventListener("change", () => {
  const incoming = Array.from(images.files || []);

  selectedFiles = incoming.slice(0, 3);

  if (incoming.length > 3) {
    toast("Only the first three images were selected.", "warning", {
      title: "Photo limit",
    });
  }

  renderPreviews();
});

function renderPreviews() {
  preview.innerHTML = "";

  counter.textContent = `${selectedFiles.length} / 3`;

  selectedFiles.forEach((file, index) => {
    const url = URL.createObjectURL(file);

    const item = document.createElement("div");

    item.className = "preview-item";

    item.innerHTML = `
                <img
                    src="${url}"
                    alt="Selected image ${index + 1}"
                >

                <button
                    type="button"
                    data-remove="${index}"
                    aria-label="Remove image"
                >
                    ×
                </button>
            `;

    preview.appendChild(item);
  });
}

preview?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");

  if (!button) {
    return;
  }

  const index = Number(button.dataset.remove);

  selectedFiles.splice(index, 1);

  renderPreviews();
});

/* =========================================================
   SUBMIT
========================================================= */

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);

  try {
    loading(button, true, "Publishing...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Please sign in first.");
    }

    /*
     * Upload images.
     */

    const imageUrls = await uploadPublicMany(selectedFiles, type || "general", 3);

    let payload;

    if (type === "marketplace") {
      payload = {
        posted_by: user.id,

        title: required(data, "title"),

        category: required(data, "category"),

        price: number(data.get("price")),

        contact_number: required(data, "contact_number"),

        item_condition: value(data, "item_condition"),

        location_details: value(data, "location_details"),

        description: value(data, "description"),

        image_urls: imageUrls,

        status: "active",
      };
    } else if (type === "housing") {
      payload = {
        posted_by: user.id,

        title: required(data, "title"),

        location_details: required(data, "location_details"),

        rent: number(data.get("rent")),

        utilities: value(data, "utilities"),

        security_notes: value(data, "security_notes"),

        contact_number: required(data, "contact_number"),

        description: value(data, "description"),

        image_urls: imageUrls,

        available: true,
      };
    } else if (type === "printing") {
      payload = {
        owner_id: user.id,

        name: required(data, "name"),

        location_details: value(data, "location_details"),

        contact_number: required(data, "contact_number"),

        notes: value(data, "notes"),

        image_urls: imageUrls,

        available: true,
      };
    } else if (type === "service") {
      payload = {
        provider_id: user.id,

        provider_name: required(data, "provider_name"),

        skill_category: required(data, "skill_category"),

        service_title: required(data, "service_title"),

        description: value(data, "description"),

        starting_price: number(data.get("starting_price")),

        contact_number: required(data, "contact_number"),

        image_urls: imageUrls,
      };
    } else if (type === "academic") {
      const file = data.get("resourceFile");

      if (!file || !file.size) {
        throw new Error("Please select the academic document.");
      }

      const fileUrl = await uploadDocument(file, user.id);

      payload = {
        uploaded_by: user.id,

        title: required(data, "title"),

        department: required(data, "department"),

        academic_year: value(data, "academic_year"),

        course_code: value(data, "course_code"),

        file_url: fileUrl,

        file_name: file.name,

        image_urls: imageUrls,
      };
    }

    const { error } = await supabase.from(config.table).insert(payload);

    if (error) {
      throw error;
    }

    toast(config.success, "success", {
      title: "Published successfully",
      duration: 4500,
    });

    form.reset();

    selectedFiles = [];

    renderPreviews();

    setTimeout(() => {
      location.href = config.redirect;
    }, 900);
  } catch (error) {
    console.error("Create listing error:", error);

    toast(friendlyError(error), "error", {
      title: "Could not publish",
    });
  } finally {
    loading(button, false);
  }
});

function value(formData, name) {
  return String(formData.get(name) || "").trim() || null;
}

function required(formData, name) {
  const value = String(formData.get(name) || "").trim();

  if (!value) {
    throw new Error(`Please enter ${label(name)}.`);
  }

  return value;
}

function number(value) {
  if (value === null || value === "") {
    return null;
  }

  const n = Number(value);

  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Please enter a valid amount.");
  }

  return n;
}

function label(name) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function uploadDocument(file, userId) {
  const path = `${userId}/academic/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;

  const { error } = await supabase.storage
    .from("hub-private")
    .upload(path, file, {
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return path;
}

function friendlyError(error) {
  const message = String(error?.message || "");

  if (message.includes("duplicate")) {
    return "This information is already registered.";
  }

  if (message.includes("row-level security")) {
    return "You do not have permission to publish this listing.";
  }

  if (message.includes("violates")) {
    return "Some of the information entered is not valid.";
  }

  return message || "Something went wrong while publishing.";
}

function input(name, label, placeholder, required = false, type = "text") {
  return `
        <div class="field">

            <label for="${name}">
                ${label}
            </label>

            <input
                id="${name}"
                name="${name}"
                type="${type}"
                placeholder="${placeholder}"
                ${required ? "required" : ""}
            >

        </div>
    `;
}

function textarea(name, label, placeholder) {
  return `
        <div class="field">

            <label for="${name}">
                ${label}
            </label>

            <textarea
                id="${name}"
                name="${name}"
                rows="5"
                placeholder="${placeholder}"
            ></textarea>

        </div>
    `;
}

function select(name, label, options, required = false) {
  return `
        <div class="field">

            <label for="${name}">
                ${label}
            </label>

            <select
                id="${name}"
                name="${name}"
                ${required ? "required" : ""}
            >

                <option value="">
                    Select ${label}
                </option>

                ${options
                  .map(
                    (option) =>
                      `
                                <option
                                    value="${escapeHTML(option)}"
                                >
                                    ${escapeHTML(option)}
                                </option>
                            `,
                  )
                  .join("")}

            </select>

        </div>
    `;
}
