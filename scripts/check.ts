import Ajv2020 from "ajv/dist/2020.js";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a package configuration object");
  return value as JsonObject;
}

async function readJson(root: string, path: string): Promise<JsonObject> {
  return object(JSON.parse(await Bun.file(join(root, path)).text()));
}

export async function skillHashes(root: string): Promise<Record<string, string>> {
  const paths: string[] = [];
  async function walk(directory: string) {
    for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error("Vendored skill snapshot must not contain symlinks");
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) paths.push(path);
    }
  }
  await walk("skills");
  const pairs = await Promise.all(paths.sort().map(async (path) => [path, new Bun.CryptoHasher("sha256").update(await Bun.file(join(root, path)).arrayBuffer()).digest("hex")] as const));
  return Object.fromEntries(pairs);
}

function remote(server: JsonObject, type: string): void {
  if (server.type !== type || server.url !== "https://mcp.higgsfield.ai/mcp" || Object.keys(server).some((key) => !["type", "url"].includes(key))) {
    throw new Error("Higgsfield remote configuration must retain its official endpoint and host-managed OAuth");
  }
}

export async function validatePackage(root: string): Promise<void> {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validatePlugin = ajv.compile(await readJson(root, "schemas/plugin.schema.json"));
  const validateMcp = ajv.compile(await readJson(root, "schemas/mcp.schema.json"));
  const plugin = await readJson(root, "plugin.json");
  const mcp = await readJson(root, "mcp.json");
  if (!validatePlugin(plugin)) throw new Error("Portable plugin manifest schema is invalid");
  if (!validateMcp(mcp)) throw new Error("Portable remote MCP manifest schema is invalid");
  const pkg = await readJson(root, "package.json");
  const version = pkg.version;
  if (typeof version !== "string" || pkg.private !== true || "bin" in pkg || "publishConfig" in pkg) throw new Error("Higgsfield must remain a private check package with a version and no local runtime");
  for (const path of ["plugin.json", ".codex-plugin/plugin.json", ".claude-plugin/plugin.json", ".cursor-plugin/plugin.json"]) {
    const manifest = await readJson(root, path);
    if (manifest.name !== "higgsfield" || manifest.version !== version) throw new Error(`${path} identity or version mismatch`);
  }
  const claude = await readJson(root, ".claude-plugin/marketplace.json");
  const claudePlugins = claude.plugins;
  if (claude.name !== "higgsfield-plugin" || !Array.isArray(claudePlugins) || claudePlugins.length !== 1 || object(claudePlugins[0]).version !== version || object(claudePlugins[0]).name !== "higgsfield") throw new Error("Claude marketplace identity or version mismatch");
  const codex = await readJson(root, ".codex-plugin/plugin.json");
  if (codex.skills !== "./skills/" || codex.mcpServers !== "./.mcp.json" || "apps" in codex) throw new Error("Codex package paths are invalid");
  const cursor = await readJson(root, ".cursor-plugin/plugin.json");
  if (cursor.skills !== "./skills/" || cursor.mcpServers !== "./.cursor-plugin/mcp.json") throw new Error("Cursor package paths are invalid");
  const serverMaps = [object(mcp.mcpServers), await readJson(root, ".mcp.json"), object((await readJson(root, ".cursor-plugin/mcp.json")).mcpServers)];
  for (const [index, servers] of serverMaps.entries()) {
    if (Object.keys(servers).length !== 1) throw new Error("Only the official Higgsfield remote server is supported");
    remote(object(servers.higgsfield), index === 0 ? "streamable-http" : "http");
  }
  const marketplace = await readJson(root, ".agents/plugins/marketplace.json");
  const plugins = marketplace.plugins;
  if (marketplace.name !== "higgsfield-marketplace" || !Array.isArray(plugins) || plugins.length !== 1 || object(plugins[0]).name !== "higgsfield" || JSON.stringify(object(plugins[0]).source) !== JSON.stringify({ source: "local", path: "./" })) throw new Error("Codex marketplace source is invalid");
  const cursorMarket = await readJson(root, ".cursor-plugin/marketplace.json");
  const cursorPlugins = cursorMarket.plugins;
  if (!Array.isArray(cursorPlugins) || cursorPlugins.length !== 1 || object(cursorPlugins[0]).name !== "higgsfield" || object(cursorPlugins[0]).source !== "./") throw new Error("Cursor marketplace source is invalid");
  const expectedSkills = ["higgsfield-game-generation", "higgsfield-generate", "higgsfield-marketplace-cards", "higgsfield-product-photoshoot", "higgsfield-soul-id", "higgsfield-video-explainer", "higgsfield-websites"];
  const skills = (await readdir(join(root, "skills"), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (JSON.stringify(skills) !== JSON.stringify(expectedSkills)) throw new Error("Vendored skill names changed");
  for (const name of expectedSkills) {
    const text = await Bun.file(join(root, "skills", name, "SKILL.md")).text();
    if (!text.startsWith("---\n") || !text.includes(`name: ${name}\n`)) throw new Error(`Invalid skill frontmatter: ${name}`);
  }
  const provenance = await readJson(root, "vendor/skills-provenance.json");
  const source = object(provenance.source);
  if (provenance.algorithm !== "sha256" || source.repository !== "https://github.com/higgsfield-ai/skills" || !(source.revision === null || typeof source.revision === "string" && /^[a-f0-9]{40}$/u.test(source.revision))) throw new Error("Vendored skill provenance is invalid");
  if (JSON.stringify(provenance.files) !== JSON.stringify(await skillHashes(root))) throw new Error("Vendored skill snapshot changed or has missing files; review before updating provenance");
  for (const path of ["README.md", "LICENSE"]) if (!(await Bun.file(join(root, path)).exists())) throw new Error(`Package file missing: ${path}`);
}

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    const index = args.indexOf("--root");
    const root = resolve(index < 0 ? "." : args[index + 1] ?? ".");
    if (args.includes("--write-provenance")) {
      await Bun.write(join(root, "vendor/skills-provenance.json"), JSON.stringify({ schemaVersion: 1, source: { repository: "https://github.com/higgsfield-ai/skills", revision: null }, algorithm: "sha256", files: await skillHashes(root) }, null, 2) + "\n");
    }
    await validatePackage(root);
    console.error("Higgsfield package, host manifests and vendored skills validated.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Higgsfield package check failed");
    process.exitCode = 1;
  }
}
