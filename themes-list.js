// Renders a list of themes with on/off switches. Used by the popup and settings page.
function renderThemeList(listEl, themes, disabled, { showMatches = false } = {}) {
  listEl.replaceChildren(
    ...themes.map((theme) => {
      const li = document.createElement("li");

      const info = document.createElement("div");
      info.className = "info";
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = theme.name;
      info.append(name);
      if (theme.description) {
        const desc = document.createElement("div");
        desc.className = "meta";
        desc.textContent = theme.description;
        info.append(desc);
      }
      if (showMatches) {
        const matches = document.createElement("div");
        matches.className = "meta";
        matches.textContent = theme.matches.join(", ");
        info.append(matches);
      }

      const toggle = document.createElement("label");
      toggle.className = "switch";
      toggle.title = "Turn this theme on or off";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !disabled[theme.name];
      input.addEventListener("change", async () => {
        const { disabled: current = {} } = await chrome.storage.local.get("disabled");
        if (input.checked) delete current[theme.name];
        else current[theme.name] = true;
        await chrome.storage.local.set({ disabled: current });
      });
      toggle.append(input, document.createElement("span"));

      li.append(info, toggle);
      return li;
    }),
  );
}

function describeSync(lastSync) {
  if (!lastSync) return "Never synced";
  const when = new Date(lastSync.time).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
  if (lastSync.error) return `Sync failed ${when}`;
  return `Synced ${when}`;
}
