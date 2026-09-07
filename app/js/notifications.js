document.addEventListener("DOMContentLoaded", async () => {
  const badge = document.getElementById("notificationBadge");

  // Get current user identifier for per-user tracking
  const userId =
    localStorage.getItem("user_reg") ||
    localStorage.getItem("user_name") ||
    localStorage.getItem("fullname") ||
    "guest";
  const readStorageKey = `read_bulletins_${userId}`;
  const joinStorageKey = `user_joined_at_${userId}`;

  // Establish user join time baseline so fresh installers only see future notifications
  let userJoinedAt = localStorage.getItem(joinStorageKey);
  if (!userJoinedAt) {
    userJoinedAt = new Date().toISOString();
    localStorage.setItem(joinStorageKey, userJoinedAt);
  }

  function getReadIds() {
    try {
      return JSON.parse(localStorage.getItem(readStorageKey)) || [];
    } catch {
      return [];
    }
  }

  function markAsRead(bulletinId) {
    const readIds = getReadIds();
    if (!readIds.includes(bulletinId)) {
      readIds.push(bulletinId);
      localStorage.setItem(readStorageKey, JSON.stringify(readIds));
    }
    updateBadgeCountUI();
  }

  // Request native mobile notification permissions on load if running under Capacitor
  try {
    const LocalNotifications = window.Capacitor?.Plugins?.LocalNotifications;
    if (LocalNotifications) {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== "granted") {
        await LocalNotifications.requestPermissions();
      }
    }
  } catch (e) {
    // Fallback gracefully for standard browser testing
  }

  async function fetchAndUpdateBadge() {
    if (!badge) return;
    try {
      const { data: bulletins, error } = await db
        .from("bulletins")
        .select("id")
        .gte("created_at", userJoinedAt); // Only count bulletins from their join time onwards

      if (error) throw error;

      const readIds = getReadIds();
      const unreadCount = bulletins
        ? bulletins.filter((b) => !readIds.includes(b.id)).length
        : 0;

      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    } catch (err) {
      console.error("Failed to fetch notification count:", err);
    }
  }

  function updateBadgeCountUI() {
    fetchAndUpdateBadge();
  }

  // Load bulletins list if container exists on the page
  const itemsContainer = document.getElementById("items");
  if (itemsContainer) {
    try {
      const { data, error } = await db
        .from("bulletins")
        .select("*")
        .gte("created_at", userJoinedAt) // Only fetch bulletins from their join time onwards
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const readIds = getReadIds();
        itemsContainer.innerHTML = data
          .map((x) => {
            const isUnread = !readIds.includes(x.id);
            const unreadClass = isUnread
              ? "notification-unread"
              : "notification-read";

            return `
              <article class="notification-item ${unreadClass}" data-id="${x.id}" style="padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem; transition: all 0.2s ease; cursor: pointer; ${unreadStyle(isUnread)}">
                <div class="notification-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <h3 style="margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                    ${isUnread ? '<span style="width: 8px; height: 8px; background: var(--primary-color); border-radius: 50%; display: inline-block;"></span>' : ""}
                    ${escapeHtml(x.title)}
                  </h3>
                  <span class="notification-poster" style="font-size: 0.8rem; color: var(--text-secondary);">By: ${escapeHtml(x.posted_by || "Unknown")}</span>
                </div>
                <p style="margin: 0.5rem 0 0.25rem 0; font-size: 0.9rem; color: var(--text-main);">${escapeHtml(x.description)}</p>
                ${x.event_date ? `<small class="notification-date" style="color: var(--text-secondary);">Date: ${escapeHtml(x.event_date)}</small>` : ""}
              </article>
            `;
          })
          .join(
            "<hr style='border: none; border-top: 1px solid var(--border-subtle); margin: 0.5rem 0;'>",
          );

        // Attach click listeners to handle marking individual items as read/clicked
        itemsContainer
          .querySelectorAll(".notification-item")
          .forEach((article) => {
            article.addEventListener("click", function () {
              const id = parseInt(this.getAttribute("data-id"));
              markAsRead(id);

              // De-highlight instantly for this user
              this.classList.remove("notification-unread");
              this.classList.add("notification-read");
              this.style.borderLeft = "none";
              this.style.background = "transparent";
              this.style.opacity = "0.75";

              const dot = this.querySelector(
                "span[style*='border-radius: 50%']",
              );
              if (dot) dot.remove();
            });
          });
      } else {
        itemsContainer.innerHTML = "<p>No notifications yet.</p>";
      }
    } catch (err) {
      console.error("Error loading bulletins:", err);
      itemsContainer.innerHTML =
        "<p>Failed to load notifications. Please try again later.</p>";
    }
  }

  // Helper for inline styling based on read state
  function unreadStyle(isUnread) {
    return isUnread
      ? "border-left: 4px solid var(--primary-color); background: rgba(0, 102, 255, 0.04);"
      : "border-left: 4px solid transparent; background: transparent;";
  }

  // Get initial count for the badge
  await fetchAndUpdateBadge();

  // Listen for real-time inserts to bulletins table
  db.channel("public:bulletins")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "bulletins" },
      async (payload) => {
        const newNotice = payload.new;

        // If a new bulletin comes in that is newer than their join time, process it
        if (new Date(newNotice.created_at) >= new Date(userJoinedAt)) {
          fetchAndUpdateBadge();

          const posterName = newNotice.posted_by || "Someone";

          // Trigger native mobile local notification (with browser fallback safety)
          try {
            const LocalNotifications =
              window.Capacitor?.Plugins?.LocalNotifications;
            if (LocalNotifications) {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: `New Item Posted by ${posterName}`,
                    body: newNotice.title,
                    id: Number(newNotice.id) || Date.now(),
                  },
                ],
              });
            } else if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(`New Item Posted by ${posterName}`, {
                body: newNotice.title,
                icon: "assets/logo.svg",
              });
            }
          } catch (e) {
            console.error("Error scheduling notification:", e);
          }

          // If user is on notifications.html, dynamically prepend new unread item
          if (itemsContainer) {
            const articleHtml = `
              <article class="notification-item notification-unread" data-id="${newNotice.id}" style="padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem; transition: all 0.2s ease; cursor: pointer; border-left: 4px solid var(--primary-color); background: rgba(0, 102, 255, 0.04);">
                <div class="notification-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <h3 style="margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                    <span style="width: 8px; height: 8px; background: var(--primary-color); border-radius: 50%; display: inline-block;"></span>
                    ${escapeHtml(newNotice.title)}
                  </h3>
                  <span class="notification-poster" style="font-size: 0.8rem; color: var(--text-secondary);">By: ${escapeHtml(posterName)}</span>
                </div>
                <p style="margin: 0.5rem 0 0.25rem 0; font-size: 0.9rem; color: var(--text-main);">${escapeHtml(newNotice.description)}</p>
                ${newNotice.event_date ? `<small class="notification-date" style="color: var(--text-secondary);">Date: ${escapeHtml(newNotice.event_date)}</small>` : ""}
              </article>
            `;

            const newHr =
              "<hr style='border: none; border-top: 1px solid var(--border-subtle); margin: 0.5rem 0;'>";
            if (itemsContainer.innerHTML.includes("No notifications yet.")) {
              itemsContainer.innerHTML = articleHtml;
            } else {
              itemsContainer.innerHTML =
                articleHtml + newHr + itemsContainer.innerHTML;
            }

            // Attach listener to the newly prepended item
            const freshItem = itemsContainer.querySelector(
              `[data-id="${newNotice.id}"]`,
            );
            if (freshItem) {
              freshItem.addEventListener("click", function () {
                markAsRead(newNotice.id);
                this.classList.remove("notification-unread");
                this.classList.add("notification-read");
                this.style.borderLeft = "none";
                this.style.background = "transparent";
                this.style.opacity = "0.75";
                const dot = this.querySelector(
                  "span[style*='border-radius: 50%']",
                );
                if (dot) dot.remove();
              });
            }
          }
        }
      },
    )
    .subscribe();
});

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
