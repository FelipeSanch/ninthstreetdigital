/**
 * Core populate logic - reusable runner
 */

import { AllPlaceTypes } from "@/lib/clients/google";
import { getStats } from "@/lib/db";
import { LeadService } from "@/lib/leads";
import { loadCities, loadTypes, type City, type PopulateConfig } from "./config";
import { clearProgress, loadProgress, saveProgress } from "./progress";

interface Query {
  city: City;
  businessType: string;
  includedType: string | undefined;
}

export interface PopulateResult {
  success: number;
  cached: number;
  errors: number;
  places: number;
  elapsed: number;
  stats: Awaited<ReturnType<typeof getStats>>;
}

const googleTypes = new Set<string>(AllPlaceTypes);

/**
 * Run population with given config
 */
export async function runPopulate(config: PopulateConfig): Promise<PopulateResult> {
  const { dryRun = false, quiet = false, resume = false, reset = false } = config;

  // Handle reset
  if (reset) {
    await clearProgress();
    console.log("Progress cleared.");
  }

  // Load cities and types
  const cities = await loadCities(config.cities);
  const types = await loadTypes(config.types);

  // Generate queries
  const allQueries: Query[] = [];
  for (const city of cities) {
    for (const businessType of types) {
      allQueries.push({
        city,
        businessType,
        includedType: googleTypes.has(businessType) ? businessType : undefined,
      });
    }
  }

  // Determine starting offset
  let startOffset = 0;
  if (resume) {
    startOffset = await loadProgress();
    if (startOffset > 0) {
      console.log(`Resuming from offset ${startOffset.toLocaleString()}`);
    }
  }

  // Apply limit
  const queryLimit = config.limit ?? Infinity;
  const queries = allQueries.slice(startOffset, startOffset + queryLimit);
  const total = queries.length;

  // Log config
  console.log(
    `Queries: ${total.toLocaleString()} / ${allQueries.length.toLocaleString()} (${types.length} types × ${cities.length} cities)`
  );
  console.log(`  Cities: pop ${config.cities.minPop.toLocaleString()}-${config.cities.maxPop.toLocaleString()}`);
  if (config.cities.states === "distinct") {
    const uniqueStates = new Set(cities.map((c) => c.stateCode));
    console.log(`  States: ${uniqueStates.size} distinct states`);
  } else if (Array.isArray(config.cities.states)) {
    console.log(`  States: ${config.cities.states.join(", ")}`);
  }
  console.log(`  Starting at offset: ${startOffset.toLocaleString()}`);

  // Dry run - just show sample
  if (dryRun) {
    console.log("\nSample queries:");
    for (const q of queries.slice(0, 15)) {
      const filter = q.includedType ? ` [filter: ${q.includedType}]` : "";
      console.log(`  "${q.businessType} in ${q.city.name}, ${q.city.stateCode}"${filter}`);
    }
    console.log("\nSample cities:");
    const sampleCities = cities.slice(0, 10);
    for (const c of sampleCities) {
      console.log(`  ${c.name}, ${c.stateCode} (pop ${c.population.toLocaleString()})`);
    }
    return {
      success: 0,
      cached: 0,
      errors: 0,
      places: 0,
      elapsed: 0,
      stats: await getStats(),
    };
  }

  // Run queries
  const service = new LeadService();
  let success = 0;
  let cached = 0;
  let errors = 0;
  let places = 0;
  const start = Date.now();

  for (let i = 0; i < total; i++) {
    const globalOffset = startOffset + i;
    const query = queries[i];
    if (!query) continue;

    const { city, businessType, includedType } = query;

    try {
      const result = await service.search(
        {
          textQuery: `${businessType} in ${city.name}, ${city.stateCode}`,
          includedType,
          maxResultCount: 20,
          locationBias: {
            circle: {
              center: { latitude: city.lat, longitude: city.lng },
              radius: 50000,
            },
          },
        },
        { allPages: true }
      );

      if (result.cached) {
        cached++;
      } else {
        success++;
        places += result.places.length;
        if (!quiet) {
          console.log(
            `[${i + 1}/${total}] ${businessType} in ${city.name}, ${city.stateCode}: ${result.places.length}`
          );
        }
        await Bun.sleep(150); // ~400/min, well under 600/min limit
      }
    } catch (e) {
      errors++;
      if (!quiet) console.error(`[${i + 1}/${total}] ERROR: ${e}`);
      await Bun.sleep(500);
    }

    // Save progress every 100 queries
    if ((i + 1) % 100 === 0) {
      await saveProgress(globalOffset + 1);
    }

    // Log progress every 500
    if ((i + 1) % 500 === 0) {
      const elapsed = (Date.now() - start) / 1000;
      const rate = (i + 1) / elapsed;
      const eta = (total - i - 1) / rate / 60;
      console.log(
        `--- ${i + 1}/${total} | ${success} ok, ${cached} cached, ${errors} err | ${places} places | ETA ${eta.toFixed(1)}m ---`
      );
    }
  }

  // Clear progress on completion
  await clearProgress();

  const elapsed = (Date.now() - start) / 1000;
  const stats = await getStats();

  console.log(`\n=== DONE in ${(elapsed / 60).toFixed(1)}m ===`);
  console.log(`Success: ${success} | Cached: ${cached} | Errors: ${errors}`);
  console.log(`New places: ${places}`);
  console.log(
    `DB: ${stats.totalPlaces} total (${stats.withWebsite} w/ site, ${stats.withoutWebsite} w/o site)`
  );

  return { success, cached, errors, places, elapsed, stats };
}
