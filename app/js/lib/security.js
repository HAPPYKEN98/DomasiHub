export function normalizeText(v, max = 500) {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}
export function normalizeReg(v) {
  return normalizeText(v, 30).toUpperCase().replace(/\s+/g, "");
}
export function validReg(v) {
  return /^BED\/(SCI|HUM|SSC|LAC)(?:\/ODEL)?\/\d{3,4}\/\d{2}$/i.test(
    normalizeReg(v),
  );
}
export function escapeHTML(v) {
  return String(v ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;",
      })[c],
  );
}
export function initials(name = "User") {
  return (
    normalizeText(name, 100)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0].toUpperCase())
      .join("") || "U"
  );
}
