import { readFileSync, writeFileSync } from "node:fs";

const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);
const lines = Object.entries(lock.packages)
  .filter(([path]) => path)
  .sort(([a], [b]) => a.localeCompare(b, "en"))
  .map(([path, pkg]) => {
    if (!pkg.version) throw new Error(`Missing locked version: ${path}`);
    const name = path.slice(
      path.lastIndexOf("node_modules/") + "node_modules/".length,
    );
    return `# ${name}==${pkg.version}  [npm: ${path}]`;
  });
const output = [
  "# Poniatbo / Понятно — dependency inventory for the hackathon.",
  "# Runtime: Node.js 24 (>=24.5 recommended); Python dependencies: none.",
  "# This is a Node.js project, NOT a pip dependency list.",
  "# Every npm package and exact installed version follows, including transitives.",
  "# npm entries are comments so pip will not install unrelated Python namesakes.",
  "# Install: npm ci --omit=dev (package-lock.json is the authoritative lockfile).",
  "# Regenerate: node scripts/export-requirements.mjs",
  "# Verify: node scripts/export-requirements.mjs --check",
  "# Built-in node:* modules are supplied by Node.js, not installed separately.",
  `# Total locked npm packages: ${lines.length}`,
  "",
  ...lines,
  "",
].join("\n");
const target = new URL("../requirements.txt", import.meta.url);
if (process.argv.includes("--check")) {
  const actual = readFileSync(target, "utf8").replace(/\r\n/g, "\n");
  if (actual !== output)
    throw new Error("requirements.txt is out of date; regenerate it.");
  console.log(
    `requirements.txt matches package-lock.json: ${lines.length} packages.`,
  );
} else {
  writeFileSync(target, output);
  console.log(`Wrote requirements.txt: ${lines.length} packages.`);
}
