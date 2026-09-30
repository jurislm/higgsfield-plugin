import { expect, test } from "bun:test";
import { parse } from "yaml";

test("Git release workflow preserves source checks and does not publish an npm runtime", async () => {
  const ci = parse(await Bun.file(".woodpecker/ci.yml").text());
  expect(ci.steps.check.commands).toContain("bun install --frozen-lockfile");
  expect(ci.steps.check.commands).toContain("bun run check");
  const release = parse(await Bun.file(".woodpecker/release.yml").text());
  expect(release.when).toEqual([{ event: "push", branch: "main" }]);
  expect(release.steps.map((step: { name: string }) => step.name)).toEqual(["github-release", "release-pr"]);
  const text = JSON.stringify(release);
  expect(text).toContain("jurislm/higgsfield-plugin");
  expect(text).not.toContain("npm_token");
  expect(text).not.toContain("bun publish");
  const pkg = await Bun.file("package.json").json();
  expect(pkg.private).toBe(true);
  expect(pkg.bin).toBeUndefined();
});

test("Release Please updates host package versions without touching vendored skills", async () => {
  const config = await Bun.file("release-please-config.json").json();
  const paths = config.packages["."].extraFiles ?? config.packages["." ]["extra-files"];
  expect(paths.map((entry: { path: string }) => entry.path).sort()).toEqual([".claude-plugin/marketplace.json", ".claude-plugin/plugin.json", ".codex-plugin/plugin.json", ".cursor-plugin/plugin.json", "plugin.json"]);
  expect(JSON.stringify(paths)).not.toContain("skills/");
});
