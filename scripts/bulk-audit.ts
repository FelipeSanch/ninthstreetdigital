/**
 * Bulk audit all places with websites
 *
 * Usage:
 *   bun scripts/bulk-audit.ts              # Audit all
 *   bun scripts/bulk-audit.ts --limit 100  # First 100
 *   bun scripts/bulk-audit.ts --quiet      # Minimal logging
 */

import { scrapeWebsite } from "@/lib/audit";
import { db } from "@/lib/db";
import { places, siteAudits } from "@/lib/db/schema";
import { and, isNotNull, notInArray } from "drizzle-orm";

const hasFlag = (name: string) => process.argv.includes(name);
const getArg = (name: string) => {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
};

const limit = parseInt(getArg("--limit") ?? "") || undefined;
const quiet = hasFlag("--quiet");

// Get places with websites that haven't been audited yet
const alreadyAudited = db
  .select({ placeId: siteAudits.placeId })
  .from(siteAudits);

let query = db
  .select({
    id: places.id,
    name: places.displayName,
    website: places.websiteUri,
    city: places.city,
    region: places.region,
  })
  .from(places)
  .where(
    and(isNotNull(places.websiteUri), notInArray(places.id, alreadyAudited))
  )
  .$dynamic();

if (limit) {
  query = query.limit(limit);
}

const leads = await query;

console.log(`Auditing ${leads.length} sites...\n`);

let success = 0;
let failed = 0;
let withEmails = 0;
const start = Date.now();

for (let i = 0; i < leads.length; i++) {
  const lead = leads[i];
  if (!lead?.website) continue;

  try {
    const result = await scrapeWebsite(lead.website);

    await db.insert(siteAudits).values({
      placeId: lead.id,
      url: result.url,
      success: result.success,
      error: result.error,
      emails: result.emails,
      phoneNumbers: result.phoneNumbers,
      socialLinks: result.socialLinks,
      https: result.https,
      hasViewport: result.hasViewport,
      generator: result.generator,
      freeSubdomain: result.freeSubdomain,
      copyrightYear: result.copyrightYear,
      serverHeader: result.serverHeader,
      hasSitemap: result.hasSitemap,
      hasStructuredData: result.hasStructuredData,
      loadTimeMs: result.loadTimeMs,
      pageSize: result.pageSize,
    });

    if (result.success) {
      success++;
      if (result.emails.length > 0) withEmails++;
      if (!quiet) {
        const flags = [
          !result.https && "NO-HTTPS",
          !result.hasViewport && "NO-VIEWPORT",
          result.freeSubdomain && "FREE-SUB",
          result.copyrightYear && result.copyrightYear < 2023 && `©${result.copyrightYear}`,
          result.emails.length > 0 && `${result.emails.length} emails`,
        ].filter(Boolean);
        console.log(
          `[${i + 1}/${leads.length}] ${lead.name} — ${flags.join(", ") || "ok"}`
        );
      }
    } else {
      failed++;
      if (!quiet) {
        console.log(`[${i + 1}/${leads.length}] ${lead.name} — FAILED: ${result.error}`);
      }
    }
  } catch (e) {
    failed++;
    if (!quiet) {
      console.log(`[${i + 1}/${leads.length}] ${lead.name} — ERROR: ${e}`);
    }
  }

  // Progress every 100
  if ((i + 1) % 100 === 0) {
    const elapsed = (Date.now() - start) / 1000;
    const rate = (i + 1) / elapsed;
    const eta = (leads.length - i - 1) / rate / 60;
    console.log(
      `--- ${i + 1}/${leads.length} | ${success} ok, ${failed} fail, ${withEmails} w/ emails | ETA ${eta.toFixed(1)}m ---`
    );
  }
}

const elapsed = (Date.now() - start) / 1000;
console.log(`\n=== DONE in ${(elapsed / 60).toFixed(1)}m ===`);
console.log(`Success: ${success} | Failed: ${failed}`);
console.log(`With emails: ${withEmails}`);
