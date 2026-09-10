import { StatusBar, Style } from "@capacitor/status-bar";
import { App } from "@capacitor/app";

// Initialize Status Bar settings
const setupStatusBar = async () => {
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0f172a" }); // Matches your dark theme header
  } catch (e) {
    console.log("Status bar plugin not available in browser mode");
  }
};

// Handle Android hardware/gesture back button navigation
App.addListener("backButton", ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back();
  } else {
    App.exitApp();
  }
});

// Run initialization on load
setupStatusBar();
