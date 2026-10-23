const $ = (id) => document.getElementById(id);

async function render() {
  const { themes = [], disabled = {}, lastSync, sourceUrl = "" } = await chrome.storage.local.get(null);

  if (document.activeElement !== $("url")) $("url").value = sourceUrl;

  renderThemeList($("list"), themes, disabled, { showMatches: true });
  $("list").hidden = themes.length === 0;
  $("empty").hidden = themes.length > 0;

  let status = describeSync(lastSync);
  if (lastSync?.error) status += `: ${lastSync.error}`;
  else if (lastSync) status += ` (${themes.length} theme${themes.length === 1 ? "" : "s"})`;
  if (sourceUrl) {
    try {
      status += ` · reading ${Restyle.manifestUrl(sourceUrl)}`;
    } catch {}
  }
  $("status").textContent = status;
  $("status").className = lastSync?.error ? "error" : "muted";

  const warnings = lastSync?.warnings || [];
  $("warnings").replaceChildren(
    ...warnings.map((w) => {
      const li = document.createElement("li");
      li.textContent = w;
      return li;
    }),
  );
  $("warnings").hidden = warnings.length === 0;
}

async function sync(button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Syncing…";
  await chrome.runtime.sendMessage({ type: "sync" });
  button.disabled = false;
  button.textContent = label;
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const value = $("url").value.trim();
  try {
    Restyle.manifestUrl(value);
  } catch (err) {
    $("status").textContent = err.message;
    $("status").className = "error";
    return;
  }
  await chrome.storage.local.set({ sourceUrl: value });
  $("url").blur();
  await sync($("save"));
});

$("sync").addEventListener("click", () => sync($("sync")));

chrome.storage.onChanged.addListener(render);
render();
