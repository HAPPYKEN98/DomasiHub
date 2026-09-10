// my-uploads.js

document.addEventListener("DOMContentLoaded", async () => {
  const client = window.supabaseClient || window.db;
  const container = document.getElementById("myUploadsContainer");

  const editModal = document.getElementById("editModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const editForm = document.getElementById("editUploadForm");

  // Custom Delete Modal Elements
  const deleteModal = document.getElementById("deleteModal");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  let allUserUploads = [];
  let itemToDelete = null;

  async function fetchUserUploads() {
    try {
      container.innerHTML = `
        <div class="uploads-loading">
          <div class="spinner-ring"></div>
          <p>Loading your contributions...</p>
        </div>
      `;

      // 1. Get current authenticated user session
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();

      if (authError || !user) {
        location.href = "signin.html?redirect=my-uploads.html";
        return;
      }

      // 2. Fetch items belonging to the logged-in user from both tables
      const [academicRes, listingsRes] = await Promise.all([
        client
          .from("academic_resources")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        client
          .from("listings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      let items = [];

      if (academicRes.data) {
        items.push(
          ...academicRes.data.map((item) => ({
            ...item,
            _type: "academic_resources",
            displayTitle: item.title,
            displayDesc:
              item.course_code || item.description || "Academic resource file",
          })),
        );
      }

      if (listingsRes.data) {
        items.push(
          ...listingsRes.data.map((item) => ({
            ...item,
            _type: "listings",
            displayTitle: item.title,
            displayDesc: item.description || item.category,
          })),
        );
      }

      allUserUploads = items;
      renderUploads();
    } catch (err) {
      console.error("Error fetching uploads:", err);
      container.innerHTML = `<div class="uploads-empty"><p>Failed to load uploads. Please try again later.</p></div>`;
    }
  }

  function renderUploads() {
    if (allUserUploads.length === 0) {
      container.innerHTML = `<div class="uploads-empty"><p>You haven't posted any uploads or listings yet.</p></div>`;
      return;
    }

    container.innerHTML = allUserUploads
      .map(
        (item) => `
      <div class="upload-card" data-id="${item.id}" data-type="${item._type}">
        <div>
          <div class="upload-card-header">
            <span class="upload-badge">${
              item._type === "academic_resources" ? "Academic" : "Listing"
            }</span>
            <span class="upload-date">${new Date(
              item.created_at || Date.now(),
            ).toLocaleDateString()}</span>
          </div>
          <div class="upload-card-body">
            <h3>${escapeHtml(item.displayTitle || "Untitled")}</h3>
            <p>${escapeHtml(item.displayDesc || "No description provided.")}</p>
          </div>
        </div>
        <div class="upload-card-footer">
          <button class="btn-action btn-edit" onclick="window.openEditModal('${
            item._type
          }', '${item.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit
          </button>
          <button class="btn-action btn-delete" onclick="window.promptDelete('${
            item._type
          }', '${item.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Delete
          </button>
        </div>
      </div>
    `,
      )
      .join("");
  }

  // Global functions for inline action buttons
  window.openEditModal = (type, id) => {
    const item = allUserUploads.find((u) => u.id == id && u._type === type);
    if (!item) return;

    document.getElementById("editItemId").value = item.id;
    document.getElementById("editItemCategory").value = item._type;
    document.getElementById("editTitle").value = item.displayTitle || "";
    document.getElementById("editDescription").value =
      item.description || item.course_code || "";

    const priceInput = document.getElementById("editPrice");
    if (priceInput) {
      priceInput.value = item.price || "";
    }

    if (editModal) editModal.style.display = "flex";
  };

  window.promptDelete = (type, id) => {
    itemToDelete = { type, id };
    if (deleteModal) {
      deleteModal.style.display = "flex";
    } else {
      executeDeleteFallback(type, id);
    }
  };

  async function executeDeleteFallback(type, id) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { data, error } = await client
      .from(type)
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase delete error:", error);
      alert("Failed to delete item: " + error.message);
    } else if (!data || data.length === 0) {
      alert(
        "Delete failed. You may not have permission to delete this item, or the ID was not found.",
      );
    } else {
      allUserUploads = allUserUploads.filter(
        (u) => !(u.id == id && u._type === type),
      );
      renderUploads();
    }
  }

  if (cancelDeleteBtn && deleteModal) {
    cancelDeleteBtn.addEventListener("click", () => {
      deleteModal.style.display = "none";
      itemToDelete = null;
    });
  }

  if (confirmDeleteBtn && deleteModal) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!itemToDelete) return;
      const { type, id } = itemToDelete;

      const { data, error } = await client
        .from(type)
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("Supabase delete error:", error);
        alert("Failed to delete item: " + error.message);
      } else if (!data || data.length === 0) {
        alert(
          "Delete failed. You may not have permission to delete this item, or the ID was not found.",
        );
      } else {
        allUserUploads = allUserUploads.filter(
          (u) => !(u.id == id && u._type === type),
        );
        renderUploads();
      }

      deleteModal.style.display = "none";
      itemToDelete = null;
    });
  }

  // Modal controls
  if (editModal && closeModalBtn && cancelModalBtn) {
    const closeModal = () => {
      editModal.style.display = "none";
    };
    closeModalBtn.addEventListener("click", closeModal);
    cancelModalBtn.addEventListener("click", closeModal);
  }

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editItemId").value;
      const type = document.getElementById("editItemCategory").value;
      const title = document.getElementById("editTitle").value;
      const description = document.getElementById("editDescription").value;
      const price = document.getElementById("editPrice")?.value;

      const updatePayload =
        type === "academic_resources"
          ? { title, course_code: description }
          : { title, description, price: price ? parseFloat(price) : 0 };

      const { error } = await client
        .from(type)
        .update(updatePayload)
        .eq("id", id);

      if (error) {
        alert("Failed to update item.");
      } else {
        if (editModal) editModal.style.display = "none";
        fetchUserUploads();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  fetchUserUploads();
});
