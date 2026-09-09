const db = window.supabaseClient || window.db;

document.addEventListener("DOMContentLoaded", async () => {
  // Strictly ensure this code only runs on portal.html to prevent cross-page loops
  if (!window.location.pathname.includes("portal")) {
    return;
  }

  // Authentication Guard: Redirect to signin/signup if not authenticated
  const client = window.supabaseClient || window.db;
  if (client) {
    try {
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session) {
        const isNewUser = localStorage.getItem("is_new_user") !== "false";
        window.location.href = isNewUser ? "signup.html" : "portal.html";
        return;
      }
    } catch (err) {
      console.error("Auth session check failed:", err);
      window.location.href = "portal.html";
      return;
    }
  }

  // Automatically attach submit handlers to ALL forms on the portal page
  const allForms = document.querySelectorAll("form");
  allForms.forEach((form) => {
    form.setAttribute("method", "POST");
    form.addEventListener("submit", (e) => {
      let category = "marketplace"; // default fallback

      const formId = form.id.toLowerCase();
      if (formId.includes("printer") || formId.includes("printing")) {
        category = "printing";
      } else if (formId.includes("accommodation")) {
        category = "accommodation";
      } else if (
        formId.includes("money") ||
        formId.includes("airtel") ||
        formId.includes("mpamba")
      ) {
        const categorySelect = form.querySelector('select[name="category"]');
        category = categorySelect ? categorySelect.value : "airtel_money";
      } else if (formId.includes("expert") || formId.includes("skill")) {
        category = "expert";
      }

      handleFormSubmit(e, category);
    });
  });
});

// Sanitize Malawian phone numbers prior to saving
function sanitizeMalawianWhatsApp(rawNumber) {
  if (!rawNumber) return "";
  let cleaned = rawNumber.trim().replace(/[\s()-]/g, "");
  if (cleaned.startsWith("+265")) return cleaned.replace("+", "");
  if (cleaned.startsWith("265") && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 10)
    return "265" + cleaned.substring(1);
  if (cleaned.length === 9) return "265" + cleaned;
  return cleaned;
}

// Custom styled modal alert helper with guaranteed high z-index and visibility
function showPortalAlert(message, callback) {
  let alertOverlay = document.getElementById("portalCustomAlert");

  if (!alertOverlay) {
    alertOverlay = document.createElement("div");
    alertOverlay.id = "portalCustomAlert";
    alertOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    `;
    alertOverlay.innerHTML = `
      <div class="custom-alert-box" style="
        background: #1e293b;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        color: #f8fafc;
        font-family: inherit;
      ">
        <p id="portalCustomAlertMessage" style="margin-bottom: 1.5rem; font-size: 1.05rem; line-height: 1.5;"></p>
        <button id="portalCustomAlertBtn" style="
          padding: 0.7rem 2rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          background: #0066FF;
          color: white;
          font-size: 0.95rem;
        ">OK</button>
      </div>
    `;
    document.body.appendChild(alertOverlay);
  }

  const msgEl = document.getElementById("portalCustomAlertMessage");
  if (msgEl) {
    msgEl.textContent = message;
  }

  alertOverlay.style.visibility = "visible";
  alertOverlay.style.opacity = "1";

  const alertBtn = document.getElementById("portalCustomAlertBtn");
  const handleClose = () => {
    alertOverlay.style.opacity = "0";
    alertOverlay.style.visibility = "hidden";
    alertBtn.onclick = null;
    if (callback) callback();
  };

  alertBtn.onclick = handleClose;
}

async function uploadImageToSupabase(file) {
  if (!file || file.size === 0) return "";
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  const filePath = `listings/${fileName}`;

  const client = window.supabaseClient || window.db;

  const { error: uploadError } = await client.storage
    .from("listings-bucket")
    .upload(filePath, file);

  if (uploadError) {
    throw new Error("Image Upload Failed: " + uploadError.message);
  }

  const { data } = client.storage
    .from("listings-bucket")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function handleFormSubmit(e, category) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Publishing...";
  }

  try {
    const client = window.supabaseClient || window.db;
    if (!client) {
      throw new Error("Supabase client connection not found.");
    }

    // Fetch current authenticated user ID to satisfy NOT NULL constraints safely
    let userId = null;
    try {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (user) userId = user.id;
    } catch (authErr) {
      console.warn("Could not fetch auth user directly:", authErr);
    }

    const formData = new FormData(form);
    const imageFile = formData.get("image");
    let imageUrl = "";

    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImageToSupabase(imageFile);
    }

    const fullName =
      localStorage.getItem("user_name") ||
      localStorage.getItem("user_fullname") ||
      localStorage.getItem("fullname") ||
      localStorage.getItem("username") ||
      "Campus Student";

    const regNumber =
      localStorage.getItem("user_reg") ||
      localStorage.getItem("regNumber") ||
      "";

    const postedByFormatted = regNumber
      ? `${fullName} (${regNumber})`
      : fullName;

    const titleText = formData.get("title") || "New Listing";
    const rawContact = formData.get("contact_number") || "";
    const sanitizedContact = sanitizeMalawianWhatsApp(rawContact);

    const payload = {
      category: category,
      title: titleText,
      price: parseFloat(formData.get("price")) || 0,
      contact_number: sanitizedContact || "265000000000", // Fallback if contact is not strictly required by some forms
      image_path: imageUrl,
      item_condition: formData.get("item_condition") || "",
      security_condition: formData.get("security_condition") || "",
      agent_code: formData.get("agent_code") || "",
      location_details: formData.get("location_details") || "",
      description:
        formData.get("description") || formData.get("agent_code") || "",
      posted_by: postedByFormatted,
    };

    // Include user_id if retrieved
    if (userId) {
      payload.user_id = userId;
    }

    console.log("Submitting payload to listings:", payload);

    const { data: insertData, error } = await client
      .from("listings")
      .insert([payload])
      .select();

    if (error) {
      console.error("Supabase insert error details:", error);
      throw new Error("Database Insert Failed: " + error.message);
    }

    console.log("Listing inserted successfully:", insertData);

    // Trigger real-time notification in bulletins table
    const categoryNameFormatted =
      category === "airtel_money"
        ? "Airtel Money Agent"
        : category === "tnm_mpamba"
        ? "TNM Mpamba Agent"
        : category === "expert"
        ? "Campus Expert Service"
        : category.charAt(0).toUpperCase() + category.slice(1);

    const bulletinPayload = {
      notice_type: category,
      title: `New ${categoryNameFormatted}: ${titleText}`,
      description: `A new entry has been posted under ${categoryNameFormatted} by ${postedByFormatted}.`,
      posted_by: postedByFormatted,
    };

    if (userId) {
      bulletinPayload.user_id = userId;
    }

    const { error: bulletinError } = await client
      .from("bulletins")
      .insert([bulletinPayload]);

    if (bulletinError) {
      console.warn(
        "Error creating notification bulletin (non-fatal):",
        bulletinError.message,
      );
    }

    showPortalAlert("Success: Listing created successfully!", () => {
      form.reset();
      const fileNameDisplay = form.querySelector(".file-name-display");
      if (fileNameDisplay) {
        fileNameDisplay.textContent = "No file chosen";
      }
      const activeModal = form.closest(".modal-overlay");
      if (activeModal) {
        activeModal.classList.remove("active");
      }
      // Optional: reload page to display new entry
      window.location.reload();
    });
  } catch (error) {
    console.error("Submission failed with exception:", error);
    showPortalAlert("Error: " + (error.message || "Failed to save listing."));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publish";
    }
  }
}

document.querySelectorAll(".modal-trigger").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-modal");
    const modal = document.getElementById(target);
    if (modal) modal.classList.add("active");
  });
});

document.querySelectorAll(".close-modal, .modal-overlay").forEach((closer) => {
  closer.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("close-modal") ||
      e.target.classList.contains("modal-overlay")
    ) {
      const modal = closer.closest(".modal-overlay");
      if (modal) modal.classList.remove("active");
    }
  });
});

document.addEventListener("change", function (event) {
  if (event.target && event.target.type === "file") {
    const fileInput = event.target;
    const wrapper = fileInput.closest(".file-input-wrapper");
    if (wrapper) {
      const nameDisplay = wrapper.querySelector(".file-name-display");
      if (nameDisplay) {
        if (fileInput.files && fileInput.files.length > 0) {
          nameDisplay.textContent = fileInput.files[0].name;
        } else {
          nameDisplay.textContent = "No file chosen";
        }
      }
    }
  }
});
