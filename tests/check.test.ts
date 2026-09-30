import { expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

function check(directory = root) {
  const result = Bun.spawnSync([process.execPath, join(root, "scripts/check.ts"), "--root", directory], { stdout: "pipe", stderr: "pipe" });
  return { code: result.exitCode, text: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr) };
}

function fixture(change: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), "higgsfield-package-"));
  try {
    for (const path of ["plugin.json", "mcp.json", ".mcp.json", "package.json", "README.md", "LICENSE", "skills", "schemas", "vendor", ".claude-plugin", ".codex-plugin", ".cursor-plugin", ".agents"]) cpSync(join(root, path), join(directory, path), { recursive: true });
    change(directory);
    return check(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("package check accepts the portable remote package without running provider tools", () => {
  expect(check().code).toBe(0);
});

test("package check rejects a version mismatch", () => {
  const result = fixture((directory) => {
    const path = join(directory, ".codex-plugin/plugin.json");
    const value = JSON.parse(readFileSync(path, "utf8"));
    value.version = "9.0.0";
    writeFileSync(path, JSON.stringify(value));
  });
  expect(result.code).toBe(1);
  expect(result.text).toContain("version");
});

test("package check rejects endpoint drift and token configuration", () => {
  const result = fixture((directory) => {
    const path = join(directory, "mcp.json");
    const value = JSON.parse(readFileSync(path, "utf8"));
    value.mcpServers.higgsfield.url = "https://example.com/mcp";
    value.mcpServers.higgsfield.headers = { Authorization: "fixture-secret" };
    writeFileSync(path, JSON.stringify(value));
  });
  expect(result.code).toBe(1);
  expect(result.text).toContain("remote");
  expect(result.text).not.toContain("fixture-secret");
});

test("package check detects modified vendored skill content", () => {
  const result = fixture((directory) => {
    const path = join(directory, "skills/higgsfield-generate/SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8") + "\nchanged\n");
  });
  expect(result.code).toBe(1);
  expect(result.text).toContain("skill");
});

test("package check detects a missing skill reference", () => {
  const result = fixture((directory) => rmSync(join(directory, "skills/higgsfield-generate/references/troubleshooting.md")));
  expect(result.code).toBe(1);
  expect(result.text).toContain("skill");
});
