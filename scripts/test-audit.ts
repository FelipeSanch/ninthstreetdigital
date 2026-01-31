/**
 * Test the site audit scraper on low-rated leads from the database
 */

import { scrapeWebsite } from "@/lib/audit";
import { db } from "@/lib/db";
import { places, siteAudits } from "@/lib/db/schema";
import { and, lt, isNotNull } from "drizzle-orm";

// Get low-rated businesses (<4 stars) with websites
const leads = await db
  .select({
    id: places.id,
    name: places.displayName,
    website: places.websiteUri,
    city: places.city,
    region: places.region,
    rating: places.rating,
    ratingCount: places.userRatingCount,
  })
  .from(places)
  .where(and(isNotNull(places.websiteUri), lt(places.rating, 4)))
  .limit(10);

console.log(`Auditing ${leads.length} sites...\n`);

for (const lead of leads) {
  if (!lead.website) continue;

  console.log(`--- ${lead.name} (${lead.city}, ${lead.region}) ---`);
  console.log(`Rating: ${lead.rating}★ (${lead.ratingCount} reviews)`);
  console.log(`URL: ${lead.website}`);

  const result = await scrapeWebsite(lead.website);

  // Save to DB
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
    console.log(`  HTTPS: ${result.https ? "yes" : "NO"}`);
    console.log(`  Viewport: ${result.hasViewport ? "yes" : "NO"}`);
    console.log(`  Generator: ${result.generator ?? "(none)"}`);
    console.log(`  Copyright: ${result.copyrightYear ?? "(none)"}`);
    console.log(`  Sitemap: ${result.hasSitemap ? "yes" : "no"}`);
    console.log(`  Structured data: ${result.hasStructuredData ? "yes" : "no"}`);
    console.log(`  Free subdomain: ${result.freeSubdomain ? "YES" : "no"}`);
    console.log(`  Server: ${result.serverHeader ?? "(unknown)"}`);
    console.log(`  Load: ${result.loadTimeMs}ms | Size: ${result.pageSize}`);
    console.log(`  Emails: ${result.emails.length > 0 ? result.emails.join(", ") : "(none)"}`);
    console.log(`  Phones: ${result.phoneNumbers.length > 0 ? result.phoneNumbers.slice(0, 3).join(", ") : "(none)"}`);
    console.log(`  Social: ${Object.keys(result.socialLinks).join(", ") || "(none)"}`);
  } else {
    console.log(`  FAILED: ${result.error}`);
  }
  console.log();
}

console.log("Results saved to site_audits table.");
