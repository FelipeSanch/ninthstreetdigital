/**
 * Full outreach pipeline: generate drafts in parallel → send emails → repeat
 * Runs autonomously until target email count is reached.
 *
 * Usage:
 *   bun run scripts/outreach-pipeline.ts --target 500
 *   bun run scripts/outreach-pipeline.ts --target 100 --batch-size 10 --parallel 3
 */

import { spawn } from "node:child_process";
import Database from "bun:sqlite";
import { join } from "node:path";

const DB_PATH = join(import.meta.dir, "..", "leads.db");
const PROJECT_DIR = join(import.meta.dir, "..");

// Enable WAL mode for better concurrent access
const walDb = new Database(DB_PATH);
walDb.exec("PRAGMA journal_mode=WAL");
walDb.close();

function getStats() {
  const db = new Database(DB_PATH, { readonly: true });
  const deployed = db.query<{ count: number }, []>(
    `SELECT count(*) as count FROM drafts WHERE status = 'deployed' AND vercel_url != 'failed'`
  ).get()!.count;

  const emailed = db.query<{ count: number }, []>(
    `SELECT count(*) as count FROM outreach WHERE status = 'sent'`
  ).get()!.count;

  const readyToEmail = db.query<{ count: number }, []>(
    `SELECT count(*) as count FROM drafts d
     WHERE d.status = 'deployed' AND d.vercel_url != 'failed'
     AND d.place_id NOT IN (SELECT place_id FROM outreach)`
  ).get()!.count;

  const availableLeads = db.query<{ count: number }, []>(
    `SELECT count(*) as count FROM places p
     JOIN site_audits a ON a.place_id = p.id
     LEFT JOIN drafts d ON d.place_id = p.id
     WHERE a.success = 1 AND a.emails IS NOT NULL AND a.emails != '[]'
     AND p.website_uri IS NOT NULL AND d.id IS NULL`
  ).get()!.count;

  db.close();
  return { deployed, emailed, readyToEmail, availableLeads };
}

function runCommand(cmd: string, args: string[]): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    let output = "";
    const proc = spawn(cmd, args, {
      cwd: PROJECT_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.stdout.on("data", (d: Buffer) => { output += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { output += d.toString(); });
    proc.on("close", (code: number) => resolve({ code: code ?? 1, output }));
    proc.on("error", (err: Error) => resolve({ code: 1, output: err.message }));
  });
}

async function runGenerateBatch(batchSize: number, id: number): Promise<number> {
  console.log(`   [gen-${id}] Generating ${batchSize} drafts...`);
  const { code, output } = await runCommand("bun", [
    "run", "scripts/generate-drafts.ts", "--limit", String(batchSize)
  ]);

  const successes = (output.match(/✅/g) || []).length;
  const failures = (output.match(/❌/g) || []).length;
  console.log(`   [gen-${id}] Done: ${successes} deployed, ${failures} failed (exit ${code})`);
  return successes;
}

async function runSendEmails(limit: number): Promise<number> {
  console.log(`\n   📧 Sending up to ${limit} emails...`);
  const { output } = await runCommand("bun", [
    "run", "outreach/send.ts", "--limit", String(limit)
  ]);

  const sent = (output.match(/✓ Sent/g) || []).length;
  const lines = output.split("\n").filter(l => l.includes("✓ Sent") || l.includes("✗ Failed") || l.includes("Done:"));
  for (const line of lines.slice(-3)) console.log(`   ${line.trim()}`);
  return sent;
}

async function main() {
  const args = process.argv.slice(2);
  const targetIdx = args.indexOf("--target");
  const target = targetIdx !== -1 ? parseInt(args[targetIdx + 1] || "500") : 500;
  const batchIdx = args.indexOf("--batch-size");
  const batchSize = batchIdx !== -1 ? parseInt(args[batchIdx + 1] || "5") : 5;
  const parallelIdx = args.indexOf("--parallel");
  const parallel = parallelIdx !== -1 ? parseInt(args[parallelIdx + 1] || "1") : 1;

  console.log(`\n🚀 NSD Outreach Pipeline`);
  console.log(`   Target: ${target} emails | Batch: ${batchSize} per worker | Workers: ${parallel}\n`);

  let totalSentThisRun = 0;
  let round = 0;
  const startTime = Date.now();

  while (totalSentThisRun < target) {
    round++;
    const stats = getStats();
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const totalEverSent = stats.emailed;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 Round ${round} | ${elapsed}min | This run: ${totalSentThisRun} | Total ever: ${totalEverSent}`);
    console.log(`   Ready to email: ${stats.readyToEmail} | Available leads: ${stats.availableLeads}`);
    console.log(`${"=".repeat(60)}`);

    if (stats.availableLeads === 0 && stats.readyToEmail === 0) {
      console.log("⚠️  No more leads available. Stopping.");
      break;
    }

    // Step 1: Send any emails that are ready
    if (stats.readyToEmail > 0) {
      const sent = await runSendEmails(stats.readyToEmail);
      totalSentThisRun += sent;
      if (totalSentThisRun >= target) break;
    }

    // Step 2: Generate drafts in parallel
    if (stats.availableLeads > 0) {
      const workersToUse = Math.min(parallel, Math.ceil(stats.availableLeads / batchSize));
      const perWorker = batchSize;

      console.log(`\n   🏗️  Launching ${workersToUse} parallel generators (${perWorker} each)...`);

      const promises = Array.from({ length: workersToUse }, (_, i) =>
        runGenerateBatch(perWorker, i + 1)
      );
      const results = await Promise.all(promises);
      const totalGenerated = results.reduce((a, b) => a + b, 0);
      console.log(`   🏗️  Total generated: ${totalGenerated}`);

      // Step 3: Send newly generated drafts
      if (totalGenerated > 0) {
        const sent = await runSendEmails(totalGenerated + 5); // +5 buffer for any stragglers
        totalSentThisRun += sent;
      }
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const finalStats = getStats();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🏁 Pipeline complete!`);
  console.log(`   Sent this run: ${totalSentThisRun}`);
  console.log(`   Total ever emailed: ${finalStats.emailed}`);
  console.log(`   Time: ${totalElapsed} minutes`);
  console.log(`${"=".repeat(60)}\n`);
}

main().catch((error) => {
  console.error("Fatal pipeline error:", error);
  process.exit(1);
});
