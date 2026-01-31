import type { BusinessInput, WebDevSetupResult } from "@/types";
import { webDevDefinition } from "./definition";
import { run } from "./runner";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "") // drop apostrophes
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export async function setup(
  business: BusinessInput,
): Promise<WebDevSetupResult> {
  const companySlug = generateSlug(business.name);
  return { companySlug };
}

export { run, webDevDefinition as definition };
