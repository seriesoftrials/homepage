try {
  if (localStorage.getItem("serial-theme") === "dark") {
    document.documentElement.dataset.theme = "dark";
    document.querySelector('meta[name="theme-color"]').content = "#0f1113";
  }
} catch {
  // The default light theme works when browser storage is unavailable.
}
