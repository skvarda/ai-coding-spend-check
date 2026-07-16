import { cp, mkdir, rm } from "node:fs/promises";

const outputDirectory = new URL("../dist/", import.meta.url);
const publicDirectory = new URL("../public/", import.meta.url);
const auditSource = new URL("../src/audit.js", import.meta.url);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(publicDirectory, outputDirectory, { recursive: true });
await cp(auditSource, new URL("audit.js", outputDirectory));

console.log("Built static site in dist/");
