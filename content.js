(() => {
  const style = document.createElement("style");
  style.id = "restyle";
  let state = { themes: [], disabled: {}, paused: false };

  function cssFor(href) {
    if (state.paused) return "";
    return state.themes
      .filter((t) => !state.disabled[t.name] && Restyle.themeMatches(t, href))
      .map((t) => `/* Restyle: ${t.name} */\n${t.css}`)
      .join("\n\n");
  }

  function apply() {
    const css = cssFor(location.href);
    if (!css) {
      style.remove();
      return;
    }
    if (style.textContent !== css) style.textContent = css;
    // Keep our sheet last so it wins ties against the page's own styles.
    const root = document.documentElement;
    if (root && root.lastElementChild !== style) root.appendChild(style);
  }

  async function load() {
    state = { ...state, ...(await chrome.storage.local.get(["themes", "disabled", "paused"])) };
    state.themes ||= [];
    state.disabled ||= {};
    apply();
  }

  load();
  chrome.storage.onChanged.addListener((changes, area) => area === "local" && load());

  // The page's own <head> styles get parsed after us; move to the end once they exist.
  document.addEventListener("DOMContentLoaded", apply);

  // Single-page apps (YouTube etc.) change URL without reloading.
  if (window.navigation) navigation.addEventListener("navigatesuccess", apply);
  window.addEventListener("popstate", apply);
})();
