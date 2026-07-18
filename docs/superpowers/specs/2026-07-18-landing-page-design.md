# Higgsfield Plugin GitHub Pages Landing Page — Design

## Goal

Give `jurislm/higgsfield-plugin` a public single-page website (GitHub Pages) that
introduces the plugin, shows the install command, and lists the 7 bundled skills
plus the MCP server. Content is derived from `README.md`; the page supplements it,
it does not replace it.

## Scope

- Single static HTML page (`docs/index.html`) with inline/adjacent CSS (no build step,
  no JS framework). A small amount of vanilla JS is fine for interactive touches
  (e.g. copy-to-clipboard on the install command).
- Deployed via GitHub Pages configured to serve `main` branch, `/docs` folder —
  no CI/CD, no gh-pages branch.
- Out of scope: per-skill detail pages, docs navigation, search, analytics, custom domain.

## Content sections

1. **Hero** — plugin name, one-line positioning ("Higgsfield AI 圖像/影片/3D/音訊生成 for
   Claude Code"), link to GitHub repo.
2. **Install** — the 3-line install snippet from README, with copy-to-clipboard.
3. **Skills grid** — 7 cards, one per skill in `skills/`, name + one-line description
   (pulled from README's Contents section).
4. **MCP section** — official hosted remote MCP, 70+ tools, OAuth (no API key needed).
5. **Footer** — MIT license, link to repo, link to Higgsfield AI.

## Visual direction

Use the `frontend-design` skill during implementation to pick a distinctive visual
direction (typography, color, layout) rather than a generic templated SaaS-landing
look. No dark/light theme toggle needed — pick one direction that reads well by default,
respecting `prefers-color-scheme` if it's low-cost to support.

## Deployment

- Files live at `docs/index.html` (+ any adjacent `docs/*.css`/`docs/*.js` if not inlined).
- After merge to `main`, enable GitHub Pages via `gh api repos/jurislm/higgsfield-plugin/pages`
  (or repo Settings → Pages) with source = `main` branch, `/docs` folder.
- Resulting URL: `https://jurislm.github.io/higgsfield-plugin/`.

## Testing / verification

No test framework applies (static HTML, no build step) — verify `docs/index.html`
directly. Since the Browser pane can't navigate `file://` URLs and the Clipboard
API needs a secure/HTTP context, serve `docs/` over local HTTP (e.g. `python3 -m
http.server`) and open that in the Browser pane to visually confirm layout, links,
and copy-to-clipboard behavior — then repeat the check against the deployed
GitHub Pages HTTPS URL.
