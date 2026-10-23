// Shared helpers. Loaded as a plain script by the content script, popup, options page
// and background worker, so everything hangs off one global.
var Restyle = (() => {
  const MANIFEST_FILE = "themes.json";

  // Turn whatever the user pasted into the URL of their themes.json:
  //   https://github.com/me/themes                     -> raw .../me/themes/HEAD/themes.json
  //   https://github.com/me/themes/tree/main/some/dir  -> raw .../me/themes/main/some/dir/themes.json
  //   https://github.com/me/themes/blob/main/x.json    -> raw .../me/themes/main/x.json
  //   any other URL ending in .json                    -> used as-is
  function manifestUrl(input) {
    const url = new URL(input.trim());
    if (url.hostname === "github.com") {
      const [owner, repoRaw, kind, ref, ...rest] = url.pathname.split("/").filter(Boolean);
      if (!owner || !repoRaw) throw new Error("GitHub URL needs an owner and a repo name.");
      const repo = repoRaw.replace(/\.git$/, "");
      const raw = `https://raw.githubusercontent.com/${owner}/${repo}`;
      if ((kind === "blob" || kind === "raw") && ref && rest.length) return `${raw}/${ref}/${rest.join("/")}`;
      if (kind === "tree" && ref) return `${raw}/${[ref, ...rest, MANIFEST_FILE].join("/")}`;
      return `${raw}/HEAD/${MANIFEST_FILE}`;
    }
    if (url.pathname.endsWith(".json")) return url.href;
    return new URL(MANIFEST_FILE, url.href.endsWith("/") ? url.href : `${url.href}/`).href;
  }

  // Chrome-style match patterns ("*://*.wikipedia.org/*"). A bare domain like
  // "wikipedia.org" is shorthand for that domain and all its subdomains.
  function matchesPattern(pattern, href) {
    let url;
    try {
      url = new URL(href);
    } catch {
      return false;
    }
    const scheme = url.protocol.slice(0, -1);
    if (pattern === "<all_urls>") return ["http", "https", "file"].includes(scheme);
    if (!pattern.includes("://")) pattern = `*://*.${pattern.replace(/^\*\./, "")}/*`;

    const m = /^([a-z*]+):\/\/([^/]*)(\/.*)$/.exec(pattern);
    if (!m) return false;
    const [, patScheme, patHost, patPath] = m;

    if (patScheme === "*" ? scheme !== "http" && scheme !== "https" : patScheme !== scheme) return false;

    const host = url.hostname;
    if (patHost !== "*" && patHost !== "") {
      if (patHost.startsWith("*.")) {
        const base = patHost.slice(2);
        if (host !== base && !host.endsWith(`.${base}`)) return false;
      } else if (host !== patHost) {
        return false;
      }
    }

    const pathRe = new RegExp(`^${patPath.split("*").map(escapeRegExp).join(".*")}$`);
    return pathRe.test(url.pathname + url.search);
  }

  function escapeRegExp(s) {
    return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }

  function themeMatches(theme, href) {
    return theme.matches.some((p) => matchesPattern(p, href));
  }

  return { manifestUrl, matchesPattern, themeMatches };
})();
