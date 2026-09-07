const db = window.supabaseClient || window.db;

document.addEventListener("DOMContentLoaded", async () => {
  // Strictly ensure this code only runs on portal.html to prevent cross-page loops
  if (!window.location.pathname.includes("portal.html")) {
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
        window.location.href = isNewUser ? "signup.html" : "profile.html";
        return;
      }
    } catch (err) {
      console.error("Auth session check failed:", err);
      window.location.href = "profile.html";
      return;
    }
  }

  const marketplaceForm = document.getElementById("marketplaceForm");
  const printerForm = document.getElementById("printerForm");
  const accommodationForm = document.getElementById("accommodationForm");

  if (marketplaceForm) {
    marketplaceForm.addEventListener("submit", (e) =>
      handleFormSubmit(e, "marketplace"),
    );
  }
  if (printerForm) {
    printerForm.addEventListener("submit", (e) =>
      handleFormSubmit(e, "printing"),
    );
  }
  if (accommodationForm) {
    accommodationForm.addEventListener("submit", (e) =>
      handleFormSubmit(e, "accommodation"),
    );
  }
});

// Custom styled modal alert helper
function showPortalAlert(message, callback) {
  let alertOverlay = document.getElementById("portalCustomAlert");

  if (!alertOverlay) {
    alertOverlay = document.createElement("div");
    alertOverlay.id = "portalCustomAlert";
    alertOverlay.className = "custom-alert-overlay";
    alertOverlay.innerHTML = `
      <div class="custom-alert-box">
        <p id="portalCustomAlertMessage"></p>
        <button id="portalCustomAlertBtn" class="btn-primary" style="padding: 0.6rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">OK</button>
      </div>
    `;
    document.body.appendChild(alertOverlay);
  }

  document.getElementById("portalCustomAlertMessage").textContent = message;
  alertOverlay.classList.add("active");

  const alertBtn = document.getElementById("portalCustomAlertBtn");
  const handleClose = () => {
    alertOverlay.classList.remove("active");
    alertBtn.removeEventListener("click", handleClose);
    if (callback) callback();
  };

  alertBtn.onclick = handleClose;
}

async function uploadImageToSupabase(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `listings/${fileName}`;

  const client = window.supabaseClient || window.db;

  const { error: uploadError } = await client.storage
    .from("listings-bucket")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
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
    const payload = {
      posted_by: postedByFormatted,
      category: category,
      title: titleText,
      price: parseFloat(formData.get("price")) || 0,
      contact_number: formData.get("contact_number") || "",
      image_path: imageUrl,
      item_condition: formData.get("item_condition") || "",
      security_condition: formData.get("security_condition") || "",
      location_details: formData.get("location_details") || "",
    };

    const client = window.supabaseClient || window.db;
    const { error } = await client.from("listings").insert([payload]);

    if (error) {
      throw error;
    }

    // Trigger real-time notification in bulletins table
    const categoryNameFormatted =
      category.charAt(0).toUpperCase() + category.slice(1);
    const bulletinPayload = {
      notice_type: category,
      title: `New ${categoryNameFormatted} Listing: ${titleText}`,
      description: `A new entry has been posted in ${categoryNameFormatted} by ${postedByFormatted}.`,
      posted_by: postedByFormatted,
    };

    const { error: bulletinError } = await client
      .from("bulletins")
      .insert([bulletinPayload]);
    if (bulletinError) {
      console.error("Error creating notification bulletin:", bulletinError);
    }

    showPortalAlert("Success: Listing created successfully!", () => {
      form.reset();
      const activeModal = form.closest(".modal-overlay");
      if (activeModal) {
        activeModal.classList.remove("active");
      }
    });
  } catch (error) {
    console.error("Submission failed:", error);
    showPortalAlert("Error: " + (error.message || "Failed to save listing."));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent =
        category === "printing"
          ? "Launch Station"
          : category === "accommodation"
            ? "Publish Lodging Unit"
            : "Publish Item";
    }
  }
}

document.querySelectorAll(".modal-trigger").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-modal");
    document.getElementById(target).classList.add("active");
  });
});

document.querySelectorAll(".close-modal, .modal-overlay").forEach((closer) => {
  closer.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("close-modal") ||
      e.target.classList.contains("modal-overlay")
    ) {
      closer.closest(".modal-overlay").classList.remove("active");
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
