# Restyle

A small Stylish-style Chrome extension: apply your own CSS themes to websites. Themes live in a
separate public GitHub repo (see `restyle-themes`) and are synced into the extension.

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and pick this folder.
4. Open the extension's **Settings** (from the toolbar popup, or right-click the icon → Options).
5. Paste your themes repo URL, e.g. `https://github.com/<you>/restyle-themes`, and press **Save & sync**.

## Using it

- Themes apply automatically on the sites listed in their `matches`.
- The toolbar popup shows the themes for the current site, with a switch for each one,
  a master switch for all themes, and a **Sync** button.
- Settings lists every theme and shows sync status and any problems with `themes.json`.
- Themes re-sync every 6 hours and when Chrome starts. After pushing a change, press **Sync** to get it now.
  (GitHub's raw file server can take a few minutes to serve a new push.)

## Themes source URL

Any of these work:

| You enter                                        | Extension reads                                     |
| ------------------------------------------------ | --------------------------------------------------- |
| `https://github.com/you/repo`                    | `themes.json` on the default branch                 |
| `https://github.com/you/repo/tree/branch/folder` | `folder/themes.json` on `branch`                    |
| `https://github.com/you/repo/blob/main/x.json`   | that file                                           |
| any URL ending in `.json`                        | that file (the server must allow cross-origin reads) |

See the themes repo's readme for the `themes.json` format.

## Files

- `background.js` downloads `themes.json` and the stylesheets, stores them, and re-syncs on a timer.
- `content.js` runs on every page and adds a `<style>` tag with the CSS of matching, enabled themes.
  It updates live when themes change and on in-app navigation (YouTube etc.).
- `lib.js` turns GitHub URLs into raw-file URLs and matches page URLs against `matches` patterns.
- `popup.*`, `options.*`, `themes-list.js`, `ui.css` are the toolbar popup and settings page.
