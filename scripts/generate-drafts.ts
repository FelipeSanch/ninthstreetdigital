/**
 * Generate draft landing pages for leads
 *
 * Queries leads.db for top leads with site issues and emails but no draft yet,
 * runs the web-dev agent for each, and stores the result in the drafts table.
 *
 * Usage:
 *   bun run scripts/generate-drafts.ts --limit 5
 *   bun run scripts/generate-drafts.ts --limit 3 --dry-run
 */

import { db } from "@/lib/db/client";
import { insertDraft } from "@/lib/db/queries";
import { drafts, places, siteAudits } from "@/lib/db/schema";
import { generateAgentId, generateBatchId } from "@/lib/utils";
import type { BusinessInput } from "@/types";
import * as webDev from "@/agents/web-dev";
import { and, eq, isNull, isNotNull, sql, } from "drizzle-orm";

// ============================================
// Description generation
// ============================================

const TYPE_DESCRIPTIONS: Record<string, string[]> = {
  bakery: ["Fresh baked goods, pastries, and artisan breads"],
  restaurant: ["Delicious food and great dining experiences"],
  cafe: ["Specialty coffee, pastries, and a cozy atmosphere"],
  bar: ["Craft cocktails, cold beers, and good vibes"],
  hair_salon: ["Professional hair styling, cuts, and color services"],
  beauty_salon: ["Full-service beauty treatments and styling"],
  nail_salon: ["Manicures, pedicures, and nail art"],
  spa: ["Relaxing spa treatments and wellness services"],
  gym: ["Fitness training, classes, and gym memberships"],
  dentist: ["Quality dental care for the whole family"],
  doctor: ["Comprehensive healthcare and medical services"],
  veterinary_care: ["Compassionate veterinary care for your pets"],
  auto_repair: ["Reliable auto repair and maintenance services"],
  plumber: ["Professional plumbing services you can trust"],
  electrician: ["Licensed electrical services for home and business"],
  lawyer: ["Experienced legal representation and counsel"],
  accounting: ["Professional accounting and tax services"],
  real_estate_agency: ["Expert real estate services for buyers and sellers"],
  insurance_agency: ["Comprehensive insurance coverage and advice"],
  florist: ["Beautiful floral arrangements for every occasion"],
  pet_store: ["Quality pet supplies, food, and accessories"],
  clothing_store: ["Stylish clothing and accessories"],
  jewelry_store: ["Fine jewelry, custom pieces, and repairs"],
  furniture_store: ["Quality furniture for every room in your home"],
  hardware_store: ["Tools, supplies, and expert advice for every project"],
  pharmacy: ["Prescription services and health products"],
  laundry: ["Professional laundry and dry cleaning services"],
  locksmith: ["Fast, reliable locksmith services"],
  moving_company: ["Professional moving and relocation services"],
  travel_agency: ["Travel planning and booking services"],
  photographer: ["Professional photography for every occasion"],
  tattoo_shop: ["Custom tattoos and body art by skilled artists"],
};

// Keyword → description mapping for when primaryType is null
const NAME_KEYWORDS: [RegExp, string][] = [
  [/detail(ing)?/i, "Professional auto detailing and car care"],
  [/clean(ing|ers?)?/i, "Thorough cleaning services for homes and businesses"],
  [/housekeep(ing)?/i, "Reliable housekeeping and home cleaning"],
  [/landscap(e|ing)/i, "Landscaping, lawn care, and outdoor design"],
  [/lawn/i, "Professional lawn care and maintenance"],
  [/plumb(ing|er)/i, "Reliable plumbing services you can trust"],
  [/electri(c|cal|cian)/i, "Licensed electrical services for home and business"],
  [/roof(ing)?/i, "Quality roofing installation and repair"],
  [/paint(ing|er)/i, "Professional painting services for interior and exterior"],
  [/hvac|heat(ing)?.*cool(ing)?|air\s*condition/i, "Heating, cooling, and HVAC services"],
  [/pool/i, "Swimming pool maintenance, repair, and installation"],
  [/mov(e|ing|ers)/i, "Professional moving and relocation services"],
  [/garage\s*door/i, "Garage door installation, repair, and maintenance"],
  [/door/i, "Door installation, repair, and replacement services"],
  [/window/i, "Window installation, replacement, and repair"],
  [/floor(ing)?/i, "Flooring installation and refinishing services"],
  [/fence|fencing/i, "Fence installation and repair services"],
  [/tow(ing)?/i, "Fast, reliable towing and roadside assistance"],
  [/pest/i, "Pest control and extermination services"],
  [/tree/i, "Tree trimming, removal, and arborist services"],
  [/pressure\s*wash|power\s*wash/i, "Pressure washing for homes and driveways"],
  [/carpet/i, "Professional carpet cleaning and restoration"],
  [/appliance/i, "Appliance repair and installation services"],
  [/gutter/i, "Gutter installation, cleaning, and repair"],
  [/concrete/i, "Concrete work, foundations, and flatwork"],
  [/weld(ing)?/i, "Professional welding and fabrication"],
  [/salon|barber|hair/i, "Professional styling, cuts, and grooming"],
  [/auto|car\s*(repair|service)/i, "Trusted auto repair and vehicle maintenance"],
  [/remodel(ing)?|renovation/i, "Home remodeling and renovation services"],
  [/construct(ion)?/i, "Construction and building services"],
  [/handyman/i, "Handyman services for home repairs and odd jobs"],
  [/photo(graphy)?/i, "Professional photography for every occasion"],
  [/tattoo/i, "Custom tattoos and body art by skilled artists"],
  [/fitness|gym|train(ing|er)/i, "Fitness training and workout programs"],
  [/massage|spa|wellness/i, "Relaxing massage and wellness treatments"],
  [/laundry|dry\s*clean/i, "Professional laundry and dry cleaning"],
  [/storage/i, "Secure storage solutions for your needs"],
  [/junk|haul(ing)?/i, "Junk removal and hauling services"],
  [/dog|pet|groom/i, "Pet grooming and care services"],
];

function generateDescription(
  name: string,
  primaryType: string | null,
  city: string | null,
  region: string | null,
): string {
  const location = [city, region].filter(Boolean).join(", ");

  if (primaryType) {
    const normalizedType = primaryType.toLowerCase().replace(/\s+/g, "_");
    const templates = TYPE_DESCRIPTIONS[normalizedType];
    if (templates) {
      const template = templates[0]!;
      return location ? `${template} in ${location}` : template;
    }

    const typeLabel = primaryType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return location
      ? `Quality ${typeLabel.toLowerCase()} services in ${location}`
      : `Quality ${typeLabel.toLowerCase()} services`;
  }

  // Infer from business name keywords
  for (const [pattern, desc] of NAME_KEYWORDS) {
    if (pattern.test(name)) {
      return location ? `${desc} in ${location}` : desc;
    }
  }

  // Last resort — still decent because Claude reads the name
  return location
    ? `Local business serving ${location}`
    : `Local business providing quality services`;
}

function inferServices(primaryType: string | null): string[] {
  if (!primaryType) return ["General Services"];

  const serviceMap: Record<string, string[]> = {
    bakery: ["Custom Cakes", "Fresh Bread", "Pastries", "Catering"],
    restaurant: ["Dine-In", "Takeout", "Catering", "Private Events"],
    cafe: ["Coffee", "Espresso Drinks", "Pastries", "Light Bites"],
    bar: ["Cocktails", "Craft Beer", "Wine", "Live Events"],
    hair_salon: ["Haircuts", "Color & Highlights", "Styling", "Treatments"],
    beauty_salon: ["Facials", "Waxing", "Makeup", "Skincare"],
    nail_salon: ["Manicures", "Pedicures", "Gel Nails", "Nail Art"],
    spa: ["Massage", "Facials", "Body Treatments", "Wellness Packages"],
    gym: ["Personal Training", "Group Classes", "Memberships", "Nutrition Coaching"],
    dentist: ["General Dentistry", "Cosmetic Dentistry", "Orthodontics", "Emergency Care"],
    doctor: ["Primary Care", "Preventive Health", "Diagnostics", "Referrals"],
    veterinary_care: ["Wellness Exams", "Vaccinations", "Surgery", "Dental Care"],
    auto_repair: ["Oil Changes", "Brake Service", "Engine Repair", "Diagnostics"],
    plumber: ["Repairs", "Installation", "Emergency Service", "Drain Cleaning"],
    electrician: ["Wiring", "Panel Upgrades", "Lighting", "Emergency Service"],
    lawyer: ["Consultation", "Litigation", "Contracts", "Legal Advice"],
    real_estate_agency: ["Buying", "Selling", "Rentals", "Property Management"],
    florist: ["Wedding Flowers", "Event Arrangements", "Delivery", "Custom Bouquets"],
    photographer: ["Portraits", "Events", "Commercial", "Editing"],
    tattoo_shop: ["Custom Tattoos", "Cover-ups", "Piercings", "Flash Art"],
  };

  const normalized = primaryType.toLowerCase().replace(/\s+/g, "_");
  return serviceMap[normalized] || [
    primaryType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    "Consultations",
    "Custom Solutions",
  ];
}

// ============================================
// Lead fetching
// ============================================

interface LeadRow {
  placeId: string;
  displayName: string;
  primaryType: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  websiteUri: string | null;
  emails: string[] | null;
}

async function getLeadsForDrafts(limit: number): Promise<LeadRow[]> {
  const results = await db
    .select({
      placeId: places.id,
      displayName: places.displayName,
      primaryType: places.primaryType,
      city: places.city,
      region: places.region,
      phone: places.phone,
      websiteUri: places.websiteUri,
      emails: siteAudits.emails,
    })
    .from(places)
    .innerJoin(siteAudits, eq(siteAudits.placeId, places.id))
    .leftJoin(drafts, eq(drafts.placeId, places.id))
    .where(
      and(
        eq(siteAudits.success, true),
        isNotNull(siteAudits.emails),
        sql`${siteAudits.emails} != '[]'`,
        isNotNull(places.websiteUri),
        isNull(drafts.id),
        // Must have a valid-looking email (not empty array)
        sql`json_array_length(${siteAudits.emails}) > 0`,
        // Has at least one site issue worth fixing
        sql`(
          ${siteAudits.freeSubdomain} = 1
          OR ${siteAudits.https} = 0
          OR ${siteAudits.hasViewport} = 0
          OR ${siteAudits.loadTimeMs} > 2000
          OR ${siteAudits.copyrightYear} < 2023
          OR ${siteAudits.generator} LIKE '%Wix%'
          OR ${siteAudits.generator} LIKE '%GoDaddy%'
          OR ${siteAudits.generator} LIKE '%Weebly%'
        )`,
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(limit);

  return results as LeadRow[];
}

function getValidEmail(emails: string[] | null): string | null {
  if (!emails || emails.length === 0) return null;
  const filtered = emails.filter(
    (e) =>
      !e.includes("godaddy") &&
      !e.includes("filler@") &&
      !e.includes("latofonts") &&
      !e.includes("surgedigital") &&
      e.includes("@"),
  );
  return filtered[0] || null;
}

// ============================================
// Main
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1] || "5") : 5;
  const dryRun = args.includes("--dry-run");

  console.log(`\n🏗️  NSD Draft Generator`);
  console.log(`   Limit: ${limit} | Dry run: ${dryRun}\n`);

  // Fetch leads that need drafts
  const leads = await getLeadsForDrafts(limit);
  console.log(`Found ${leads.length} leads ready for draft generation\n`);

  if (leads.length === 0) {
    console.log("No leads found. Either all leads already have drafts or no leads match criteria.");
    return;
  }

  const batchId = generateBatchId();
  console.log(`Batch ID: ${batchId}\n`);

  // List what we'd generate
  for (const lead of leads) {
    const email = getValidEmail(lead.emails);
    const desc = generateDescription(lead.displayName, lead.primaryType, lead.city, lead.region);
    console.log(`  📋 ${lead.displayName}`);
    console.log(`     Type: ${lead.primaryType || "unknown"}`);
    console.log(`     Location: ${lead.city || "?"}, ${lead.region || "?"}`);
    console.log(`     Email: ${email || "no valid email"}`);
    console.log(`     Description: ${desc}`);
    console.log();
  }

  if (dryRun) {
    console.log("🏁 Dry run complete — no drafts generated.");
    return;
  }

  // Generate drafts
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]!;
    const email = getValidEmail(lead.emails);

    if (!email) {
      console.log(`⏭️  Skipping ${lead.displayName} — no valid email`);
      failCount++;
      continue;
    }

    console.log(`\n[${ i + 1}/${leads.length}] 🚀 Generating draft for ${lead.displayName}...`);

    const description = generateDescription(
      lead.displayName,
      lead.primaryType,
      lead.city,
      lead.region,
    );
    const services = inferServices(lead.primaryType);

    const business: BusinessInput = {
      name: lead.displayName,
      description,
      location: {
        city: lead.city || "Unknown",
        state: lead.region || undefined,
      },
      contact: {
        email,
        phone: lead.phone || undefined,
      },
      services,
      existingWebsiteUrl: lead.websiteUri || undefined,
      primaryType: lead.primaryType || undefined, // For reference site lookup
    };

    const agentId = generateAgentId();
    const { companySlug } = await webDev.setup(business);

    console.log(`   Agent: ${agentId} | Slug: ${companySlug}`);

    try {
      const result = await webDev.run({
        business,
        companySlug,
        batchId,
        agentId,
      });

      if (result.success && result.url) {
        // Update email if agent found a better one
        if (result.correctedEmail) {
          const currentEmails = lead.emails || [];
          if (!currentEmails.includes(result.correctedEmail)) {
            const updatedEmails = [result.correctedEmail, ...currentEmails];
            await db
              .update(siteAudits)
              .set({ emails: updatedEmails })
              .where(eq(siteAudits.placeId, lead.placeId));
            console.log(`   📧 Updated email: ${result.correctedEmail}`);
          }
        }

        await insertDraft({
          placeId: lead.placeId,
          batchId,
          agentId,
          vercelUrl: result.url,
          status: "deployed",
        });

        console.log(`   ✅ Deployed: ${result.url}`);
        successCount++;
      } else {
        await insertDraft({
          placeId: lead.placeId,
          batchId,
          agentId,
          vercelUrl: "failed",
          status: "failed",
        });

        console.log(`   ❌ Failed: ${result.error || "unknown error"}`);
        failCount++;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Error: ${errorMsg}`);

      await insertDraft({
        placeId: lead.placeId,
        batchId,
        agentId,
        vercelUrl: "failed",
        status: "failed",
      });

      failCount++;
    }

    // Rate limit: wait 10 seconds between agent runs
    if (i < leads.length - 1) {
      console.log(`   ⏳ Waiting 10s before next draft...`);
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }

  console.log(`\n🏁 Batch complete: ${successCount} deployed, ${failCount} failed`);
  console.log(`   Batch ID: ${batchId}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
