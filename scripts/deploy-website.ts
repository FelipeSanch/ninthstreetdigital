import { Vercel } from "@vercel/sdk";
import { readdir } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve(import.meta.dir, "../website/dist");

const client = new Vercel({ bearerToken: process.env.VERCEL_TOKEN! });
const teamId = process.env.VERCEL_TEAM_ID || undefined;

// Collect all files from dist
const entries = await readdir(distDir);
const files = await Promise.all(
  entries.map(async (name) => {
    const file = Bun.file(path.join(distDir, name));
    const content = await file.text();
    return { file: name, data: content, encoding: "utf-8" as const };
  })
);

console.log(`Deploying ${files.length} files: ${files.map(f => f.file).join(", ")}`);

const result = await client.deployments.createDeployment({
  teamId,
  requestBody: {
    name: "ninth-street-digital",
    target: "production",
    projectSettings: {
      framework: null,
      buildCommand: "",
      outputDirectory: ".",
    },
    files,
  },
});

console.log(`Deployed: https://${result.url}`);
