import { boot } from "./lib/boot.js";
import { theme } from "./lib/ui.js";
function init() {
  theme();
  boot().catch((e) => console.error("[Domasi Hub]", e));
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", init);
else init();
