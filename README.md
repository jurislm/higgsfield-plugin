# higgsfield-plugin

Portable plugin with existing Claude Code compatibility for [Higgsfield AI](https://higgsfield.ai) image/video/3D/audio generation — the official hosted remote MCP (OAuth) plus 7 CLI-based skills.

## Install

```
/plugin marketplace add jurislm/higgsfield-plugin
/plugin install higgsfield@higgsfield-plugin
/reload-plugins
```

## Codex and Cursor

```bash
codex plugin marketplace add jurislm/higgsfield-plugin
codex plugin add higgsfield@higgsfield-marketplace
```

For Cursor, import `https://github.com/jurislm/higgsfield-plugin` as a GitHub
marketplace. The portable and host manifests select the same official remote
MCP endpoint. OAuth is managed by the host; no API token or stdio launcher is
stored in this package. Keep MCP OAuth and CLI login acceptance separate.

Verify the selected repository plugin in a new ordinary host chat. Record its
package version, remote server version when available, actual tool catalog and
a read-only model query. An existing connector from another marketplace is not
proof that this repository plugin has connected.

## Contents

- MCP server: `https://mcp.higgsfield.ai/mcp` (Higgsfield's official hosted remote MCP; discover the current tool catalog from the installed connection)
- 7 skills, each a wrapper around the `higgsfield` CLI (`allowed-tools: Bash`):
  - `higgsfield-generate` — general image/video/3D/audio generation, Marketing Studio, Virality Predictor
  - `higgsfield-product-photoshoot` — branded product photography (studio/lifestyle/hero banner/ad pack modes)
  - `higgsfield-marketplace-cards` — e-commerce listing image sets (main image / A+ content)
  - `higgsfield-soul-id` — train a personalized Soul Character (face consistency)
  - `higgsfield-video-explainer` — full narrated explainer videos (storyboard + voice + assembly)
  - `higgsfield-game-generation` — browser game and game-asset generation
  - `higgsfield-websites` — full-stack website scaffolding and deployment (React 19 + TanStack Start)

## Authentication (two independent mechanisms)

**MCP (OAuth, no API key needed)**

Claude Code triggers an OAuth login on first MCP tool call (or connect manually via `/mcp`) — sign in with your Higgsfield account in the browser. No token needs to be set anywhere.

**CLI (used by the skills, separate login)**

The 7 skills call the `higgsfield` CLI (`npm install -g @higgsfield/cli`, or a skill's own bootstrap step will auto-install it if missing). CLI auth uses `higgsfield auth login` (interactive) — a separate session from the MCP OAuth above; you'll need to log in to both once.

## Source and license

- The 7 skills are vendored as-is from the official [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills) repo (MIT license). To pick up upstream updates, re-run `npx skills add higgsfield-ai/skills` and manually sync the `skills/` directory here — the local snapshot is checked by `vendor/skills-provenance.json`. Its upstream revision is currently unknown, so hashes prove local integrity rather than upstream authenticity. After reviewing an intentional update, run `bun scripts/check.ts --write-provenance`.
- MCP docs: <https://higgsfield.ai/mcp>
- This repo itself: MIT license, see `LICENSE`.

## Security notes

- `npx skills add`'s automated risk scan flagged `higgsfield-marketplace-cards` and `higgsfield-product-photoshoot` as **High Risk** (the install output itself notes "skills run with full agent permissions"). Both `SKILL.md` files were manually reviewed — they only call the corresponding `higgsfield` CLI subcommand and print the resulting URL, with no other risky behavior observed — but review before use if you re-vendor a newer version.
- All 7 skills' bootstrap steps include `curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh` (the official CLI installer, pointed at a mutable `main` branch with no version pin or checksum verification). Prefer the version-pinned `npm install -g @higgsfield/cli` and install manually to avoid triggering the auto-install path.
- `skills/higgsfield-game-generation/references/3d-animation.md` downloads a Blender release tarball directly from `download.blender.org` and extracts/executes it without checksum verification.
- `skills/higgsfield-game-generation/references/kernel-reference.md`'s multiplayer example binds a WebSocket connection's identity to a client-supplied `playerId` with no server-side verification — a client can claim any player's seat. This is upstream's example code, not something this repo's packaging introduces or can safely rewrite without full context of the surrounding session/DO architecture it assumes.

These are all inside vendored upstream content and are called out here rather than silently patched, since local fixes would drift from the "vendor as-is, re-sync on update" model above. Consider filing upstream if you rely on these code paths.

## Usage

Natural language routes to the matching skill automatically (e.g. "make me a product shot" → `higgsfield-product-photoshoot`), or invoke one directly: `/higgsfield:higgsfield-generate ...`.

## License

MIT

## Development and release

Run `bun install --frozen-lockfile` and `bun run check`. Checks validate portable
and host manifests, version alignment and the vendored skill snapshot without
connecting to Higgsfield or running its CLI. The Bun package is private and has
no runtime entrypoint. Woodpecker performs source checks and Release Please
manages Git versions/releases; no npm runtime is published.

This repository follows [JurisLM Plugin Architecture v1](https://github.com/jurislm/woodpecker-ci-plugin/blob/main/docs/plugin-architecture.md).
