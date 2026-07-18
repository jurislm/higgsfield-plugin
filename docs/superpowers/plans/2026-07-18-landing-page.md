# Higgsfield Plugin Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a single-page static GitHub Pages site at `docs/index.html` introducing the higgsfield-plugin repo.

**Architecture:** One self-contained static HTML file (CSS inlined in a `<style>` block, small vanilla JS inlined in a `<script>` block for copy-to-clipboard) — no build step, no framework, no external asset fetches. Content is sourced from `README.md`. GitHub Pages is configured after merge to serve `main` branch `/docs`.

**Tech Stack:** Plain HTML5 + CSS3 + vanilla JS. No dependencies.

## Global Constraints

- Single file: `docs/index.html` — no separate `.css`/`.js` files, no build tooling, no framework.
- No external network calls (fonts/CDNs) — page must render fully offline once loaded.
- Content must accurately reflect `README.md` (skill names/descriptions, install command, license) — no invented claims.
- Visual direction chosen via the `frontend-design` skill, not a generic template.

---

### Task 1: Build the landing page

**Files:**
- Create: `docs/index.html`
- Read (source of truth for copy): `README.md`

**Interfaces:**
- Consumes: text content from `README.md` (install command, skill list, MCP description, license).
- Produces: `docs/index.html`, a complete standalone page.

- [ ] **Step 1: Invoke the `frontend-design` skill to get visual direction (typography, color, layout) before writing markup.**

- [ ] **Step 2: Write `docs/index.html`** with the 5 sections from the spec (Hero, Install, Skills grid, MCP, Footer), inline `<style>` and `<script>`, using the copy from `README.md`:
  - Hero: title "Higgsfield Plugin", tagline "Higgsfield AI 圖像/影片/3D/音訊生成 for Claude Code", link to `https://github.com/jurislm/higgsfield-plugin`.
  - Install block with the 3 commands from README's Install section, plus a copy-to-clipboard button (vanilla JS using `navigator.clipboard.writeText`, with a visible fallback message if it's unavailable).
  - Skills grid: 7 cards, one per skill listed under README's "Contents" section, each with the skill's bolded name and its one-line description from that same bullet list.
  - MCP section: mention `https://mcp.higgsfield.ai/mcp`, "70+ tools", OAuth (no API key needed).
  - Footer: "MIT License", link to `LICENSE` in the repo, link to `https://higgsfield.ai`.

- [ ] **Step 3: Open the file in the Browser pane (`mcp__Claude_Browser__preview_start` with the local file path, or `navigate` to the `file://` path) and visually verify:**
  - All 7 skill cards render with correct names/descriptions.
  - Copy-to-clipboard button works (click it, confirm clipboard content via `mcp__Claude_Browser__javascript_tool` reading `navigator.clipboard` or a visible "copied" state).
  - Links point to the correct URLs (repo, LICENSE, higgsfield.ai).
  - Page has no horizontal scroll/layout breakage at both desktop (1280px) and mobile (375px) widths — use `mcp__Claude_Browser__resize_window`.

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "feat: add GitHub Pages landing page"
```

---

### Task 2: Enable GitHub Pages (post-merge)

**Files:** none (infrastructure/config action, not a repo file)

**Interfaces:**
- Consumes: `docs/index.html` from Task 1, already merged to `main`.
- Produces: a live GitHub Pages site at `https://jurislm.github.io/higgsfield-plugin/`.

- [ ] **Step 1: After this branch's PR is merged to `main`, enable Pages via the GitHub API:**

```bash
gh api repos/jurislm/higgsfield-plugin/pages -X POST -f "source[branch]=main" -f "source[path]=/docs"
```

If Pages is already enabled and this 409s, update instead:

```bash
gh api repos/jurislm/higgsfield-plugin/pages -X PUT -f "source[branch]=main" -f "source[path]=/docs"
```

- [ ] **Step 2: Poll build status until it's built:**

```bash
gh api repos/jurislm/higgsfield-plugin/pages/builds/latest --jq '.status'
```

Expected: eventually `"built"` (may take 1-2 minutes after enabling).

- [ ] **Step 3: Verify the live URL loads and matches the local file** — fetch `https://jurislm.github.io/higgsfield-plugin/` in the Browser pane and confirm content matches `docs/index.html`.

- [ ] **Step 4: Report the live URL to the user.** No commit needed (no repo file changes in this task).
