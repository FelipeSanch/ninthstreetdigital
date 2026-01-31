/**
 * Populate leads CLI
 *
 * Usage:
 *   bun scripts/populate-leads --help
 *   bun scripts/populate-leads --dry-run --min-pop 25000 --max-pop 50000 --limit 60 --states distinct --types ./data/custom-types.json
 *   bun scripts/populate-leads --min-pop 25000 --max-pop 50000 --limit 1000 --states CA,TX,FL --types ./data/custom-types.json
 *   bun scripts/populate-leads --resume
 */

import type { PopulateConfig } from "./config";
import { runPopulate } from "./runner";

// Re-export for programmatic use
export { runPopulate } from "./runner";
export type { PopulateConfig, CitiesConfig, City } from "./config";
export { loadCities, loadTypes } from "./config";

// CLI parsing
function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const hasFlag = (name: string) => process.argv.includes(name);

function printHelp() {
  console.log(`
Populate leads from Google Places API

Usage:
  bun scripts/populate-leads [options]

Options:
  --min-pop <n>      Minimum city population (default: 10000)
  --max-pop <n>      Maximum city population (default: 200000)
  --city-limit <n>   Number of cities to query (default: all matching)
  --states <list>    Comma-separated state codes OR "distinct" for geographic spread
  --types <path>     Path to .json or .txt file with business types
  --limit <n>        Max queries to run
  --dry-run          Preview queries without running
  --quiet            Minimal logging
  --resume           Resume from last run
  --reset            Clear progress and start fresh
  --help             Show this help

Examples:
  # Dry run: 60 cities (25-50k pop) spread across states, custom types
  bun scripts/populate-leads --dry-run --min-pop 25000 --max-pop 50000 --city-limit 60 --states distinct --types ./data/custom-types.json

  # Run 1000 queries in specific states
  bun scripts/populate-leads --min-pop 25000 --max-pop 50000 --states CA,TX,FL --types ./data/custom-types.json --limit 1000

  # Resume previous run
  bun scripts/populate-leads --resume
`);
}

// Main
if (hasFlag("--help") || hasFlag("-h")) {
  printHelp();
  process.exit(0);
}

const minPop = parseInt(getArg("--min-pop") ?? "") || 10000;
const maxPop = parseInt(getArg("--max-pop") ?? "") || 200000;
const cityLimit = parseInt(getArg("--city-limit") ?? "") || 10000; // effectively "all"
const statesArg = getArg("--states");
const typesArg = getArg("--types");

if (!typesArg) {
  console.error("Error: --types is required (path to .json or .txt file)");
  console.error("Example: --types ./data/custom-types.json");
  process.exit(1);
}
const limit = parseInt(getArg("--limit") ?? "") || undefined;

let states: string[] | "distinct" | undefined;
if (statesArg === "distinct") {
  states = "distinct";
} else if (statesArg) {
  states = statesArg.split(",").map((s) => s.trim().toUpperCase());
}

const config: PopulateConfig = {
  cities: {
    minPop,
    maxPop,
    limit: cityLimit,
    states,
  },
  types: typesArg,
  limit,
  dryRun: hasFlag("--dry-run"),
  quiet: hasFlag("--quiet"),
  resume: hasFlag("--resume"),
  reset: hasFlag("--reset"),
};

await runPopulate(config);
