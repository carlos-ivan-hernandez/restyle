importScripts("lib.js");

const SYNC_ALARM = "sync";
const SYNC_EVERY_MINUTES = 6 * 60;

// Storage layout (chrome.storage.local):
//   sourceUrl  what the user typed in settings
//   themes     [{ name, description, matches, css }] from the last good sync
//   disabled   { [themeName]: true } themes the user switched off (kept across syncs)
//   paused     true to turn every theme off
//   lastSync   { time, error, warnings }

async function sync() {
  const { sourceUrl } = await chrome.storage.local.get("sourceUrl");
  if (!sourceUrl) return { ok: false, error: "No themes URL set." };

  const lastSync = { time: Date.now(), error: null, warnings: [] };
  try {
    const manifestUrl = Restyle.manifestUrl(sourceUrl);
    const manifest = await fetchJson(manifestUrl);
    const entries = Array.isArray(manifest) ? manifest : manifest.themes;
    if (!Array.isArray(entries)) throw new Error('themes.json needs a "themes" list.');

    const themes = [];
    for (const entry of entries) {
      const problem = validate(entry);
      if (problem) {
        lastSync.warnings.push(problem);
        continue;
      }
      try {
        const css = await fetchText(new URL(entry.css, manifestUrl).href);
        themes.push({
          name: entry.name,
          description: entry.description || "",
          matches: [].concat(entry.matches),
          css,
        });
      } catch (err) {
        lastSync.warnings.push(`${entry.name}: ${err.message}`);
      }
    }
    await chrome.storage.local.set({ themes, lastSync });
    return { ok: true, count: themes.length, warnings: lastSync.warnings };
  } catch (err) {
    // Keep the themes from the last good sync so a bad push doesn't wipe everything.
    lastSync.error = err.message;
    await chrome.storage.local.set({ lastSync });
    return { ok: false, error: err.message };
  }
}

function validate(entry) {
  if (!entry || typeof entry.name !== "string" || !entry.name) return "A theme is missing its name.";
  const matches = [].concat(entry.matches || []);
  if (!matches.length || !matches.every((m) => typeof m === "string")) {
    return `${entry.name}: "matches" should list the sites it applies to.`;
  }
  if (typeof entry.css !== "string" || !entry.css) return `${entry.name}: "css" should be a stylesheet path.`;
  return null;
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText || "error"} fetching ${url}`);
  return res.text();
}

async function fetchJson(url) {
  const text = await fetchText(url);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${url} isn't valid JSON.`);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: SYNC_EVERY_MINUTES });
  sync();
});
chrome.runtime.onStartup.addListener(sync);
chrome.alarms.onAlarm.addListener((alarm) => alarm.name === SYNC_ALARM && sync());

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type === "sync") {
    sync().then(reply);
    return true; // reply arrives asynchronously
  }
});
