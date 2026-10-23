const $ = (id) => document.getElementById(id);

let tabUrl = "";

async function render() {
  const { themes = [], disabled = {}, paused = false, lastSync, sourceUrl } = await chrome.storage.local.get(null);

  $("all").checked = !paused;

  let host = "";
  try {
    host = new URL(tabUrl).hostname;
  } catch {}
  $("site").textContent = host || "This page";

  const matching = themes.filter((t) => Restyle.themeMatches(t, tabUrl));
  renderThemeList($("list"), matching, disabled);
  $("list").hidden = matching.length === 0;
  $("empty").hidden = matching.length > 0;
  $("empty").textContent = sourceUrl ? "No themes for this site." : "Add your themes URL in Settings to get started.";

  $("status").textContent = describeSync(lastSync);
  $("status").className = lastSync?.error ? "error" : "muted";
  $("status").title = lastSync?.error || "";
}

$("all").addEventListener("change", (e) => chrome.storage.local.set({ paused: !e.target.checked }));

$("sync").addEventListener("click", async () => {
  $("sync").disabled = true;
  $("sync").textContent = "Syncing…";
  await chrome.runtime.sendMessage({ type: "sync" });
  $("sync").disabled = false;
  $("sync").textContent = "Sync";
});

$("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());

chrome.storage.onChanged.addListener(render);

chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  tabUrl = tab?.url || "";
  render();
});
