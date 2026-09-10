const indicator = document.getElementById("scrollIndicator");

if (indicator) {
  indicator.style.pointerEvents = "auto";
  indicator
    .querySelectorAll("*")
    .forEach((el) => (el.style.pointerEvents = "none"));

  // Scroll down smoothly when clicked/tapped
  indicator.addEventListener("click", () => {
    // Try scrolling both the window and potential scrollable containers
    window.scrollBy({
      top: window.innerHeight * 0.75,
      behavior: "smooth",
    });

    // Fallback if main container is scrolling instead of window
    const mainContainer =
      document.querySelector("main") || document.documentElement;
    mainContainer.scrollBy({
      top: window.innerHeight * 0.75,
      behavior: "smooth",
    });
  });
}

// Fade out when user starts scrolling down
window.addEventListener("scroll", () => {
  if (!indicator) return;

  if (window.scrollY > 50 || window.pageYOffset > 50) {
    indicator.style.opacity = "0";
  } else {
    indicator.style.opacity = "1";
  }
});
