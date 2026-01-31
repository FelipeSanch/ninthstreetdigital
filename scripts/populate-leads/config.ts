/**
 * Configuration types and loaders for populate-leads
 */

export interface City {
  name: string;
  stateCode: string;
  lat: number;
  lng: number;
  population: number;
}

export interface CitiesConfig {
  minPop: number;
  maxPop: number;
  limit: number;
  states?: string[] | "distinct";
}

export interface PopulateConfig {
  cities: CitiesConfig;
  types: string[] | string; // direct array, or path to .txt/.json
  limit?: number;
  dryRun?: boolean;
  quiet?: boolean;
  resume?: boolean;
  reset?: boolean;
}

const ALL_CITIES_PATH = "./data/us-cities.json";
const CITIES_CSV_URL =
  "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/csv/cities.csv";

/**
 * Load and filter cities based on config
 * Fetches from remote CSV if local cache doesn't exist
 */
export async function loadCities(config: CitiesConfig): Promise<City[]> {
  const allCities = await getAllCities();

  // Filter by population
  let filtered = allCities.filter(
    (c) => c.population >= config.minPop && c.population <= config.maxPop
  );

  // Filter by states if specific states provided
  if (Array.isArray(config.states)) {
    const stateSet = new Set(config.states.map((s) => s.toUpperCase()));
    filtered = filtered.filter((c) => stateSet.has(c.stateCode.toUpperCase()));
  }

  // Select cities
  if (config.states === "distinct") {
    // Spread across as many different states as possible
    return selectDistinctStates(filtered, config.limit);
  }

  // Default: just take top by population
  return filtered.slice(0, config.limit);
}

/**
 * Select cities spread across distinct states
 * Round-robin through states to maximize diversity
 */
function selectDistinctStates(cities: City[], limit: number): City[] {
  // Group by state
  const byState = new Map<string, City[]>();
  for (const city of cities) {
    const existing = byState.get(city.stateCode) ?? [];
    existing.push(city);
    byState.set(city.stateCode, existing);
  }

  // Sort each state's cities by population (largest first)
  for (const stateCities of byState.values()) {
    stateCities.sort((a, b) => b.population - a.population);
  }

  // Round-robin through states
  const result: City[] = [];
  const states = [...byState.keys()].sort(); // alphabetical for consistency
  let stateIndex = 0;
  const statePointers = new Map<string, number>();

  while (result.length < limit) {
    const state = states[stateIndex % states.length];
    if (!state) break;

    const stateCities = byState.get(state) ?? [];
    const pointer = statePointers.get(state) ?? 0;

    if (pointer < stateCities.length) {
      const city = stateCities[pointer];
      if (city) {
        result.push(city);
        statePointers.set(state, pointer + 1);
      }
    }

    stateIndex++;

    // Check if we've exhausted all states
    const allExhausted = states.every((s) => {
      const p = statePointers.get(s) ?? 0;
      const c = byState.get(s) ?? [];
      return p >= c.length;
    });
    if (allExhausted) break;
  }

  return result;
}

/**
 * Load business types from config
 * Accepts: string[] (direct), path to .json, or path to .txt
 */
export async function loadTypes(types: string[] | string): Promise<string[]> {
  if (Array.isArray(types)) {
    return types;
  }

  const path = types;

  if (path.endsWith(".json")) {
    return await Bun.file(path).json();
  }

  if (path.endsWith(".txt")) {
    const text = await Bun.file(path).text();
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  }

  throw new Error(`Unknown types file format: ${path} (use .json or .txt)`);
}

/**
 * Get all US cities - loads from cache or fetches from remote
 */
async function getAllCities(): Promise<City[]> {
  // Try loading from cache first
  const cacheFile = Bun.file(ALL_CITIES_PATH);
  if (await cacheFile.exists()) {
    return await cacheFile.json();
  }

  // Fetch and parse from remote
  console.log("Fetching cities data (first run)...");
  const response = await fetch(CITIES_CSV_URL);
  const csv = await response.text();

  const cities = parseAndFilterCities(csv);

  // Cache for next time
  await Bun.write(ALL_CITIES_PATH, JSON.stringify(cities, null, 2));
  console.log(`Cached ${cities.length.toLocaleString()} US cities to ${ALL_CITIES_PATH}`);

  return cities;
}

/**
 * Parse CSV and filter to US cities
 */
function parseAndFilterCities(csv: string): City[] {
  const lines = csv.split("\n");
  const headerLine = lines[0];
  if (!headerLine) return [];

  const headers = headerLine.split(",").map((h) => h.trim());

  const rows = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });

  // Filter to US cities and map to our format
  return rows
    .filter((row) => row.country_code === "US")
    .map((row) => ({
      name: row.name ?? "",
      stateCode: row.state_code ?? "",
      lat: parseFloat(row.latitude ?? "0"),
      lng: parseFloat(row.longitude ?? "0"),
      population: parseInt(row.population ?? "0", 10),
    }))
    .filter((city) => city.name && city.stateCode && city.population > 0)
    .sort((a, b) => b.population - a.population);
}
