let allListings = [];

async function loadHomepageCounts() {
  try {
    const { data, error } = await window.db
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allListings = data || [];

    const formatCount = (count, singular, plural) =>
      `${count} ${count === 1 ? singular : plural}`;

    const marketCount = allListings.filter(
      (item) => item.category === "marketplace",
    ).length;
    const printCount = allListings.filter(
      (item) => item.category === "printing",
    ).length;
    const roomCount = allListings.filter(
      (item) => item.category === "accommodation",
    ).length;

    if (document.getElementById("marketplaceCount"))
      document.getElementById("marketplaceCount").textContent = formatCount(
        marketCount,
        "item",
        "items",
      );
    if (document.getElementById("printingCount"))
      document.getElementById("printingCount").textContent = formatCount(
        printCount,
        "station",
        "stations",
      );
    if (document.getElementById("accommodationCount"))
      document.getElementById("accommodationCount").textContent = formatCount(
        roomCount,
        "unit",
        "units",
      );
  } catch (error) {
    console.error("Failed to load listing counts for home page:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHomepageCounts();
});
