import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "audit.js",
  "template.csv",
  "robots.txt",
  "sitemap.xml",
];
for (const file of requiredFiles) {
  await access(new URL(`../dist/${file}`, import.meta.url));
}

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../dist/app.js", import.meta.url), "utf8");
const requiredIds = ["csv-file", "status", "results", "monthly-spend", "findings-list"];

for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing required element: ${id}`);
}

if (!html.includes("Content-Security-Policy")) throw new Error("Missing Content Security Policy");
if (!html.includes('rel="canonical"')) throw new Error("Missing canonical URL");
if (/innerHTML|insertAdjacentHTML|eval\s*\(/.test(app)) {
  throw new Error("Unsafe DOM or code execution pattern found in app.js");
}
if (/TODO|FIXME|example\.invalid/.test(html + app)) {
  throw new Error("Placeholder content found in release files");
}

console.log("Verified static assets and security-sensitive patterns");
