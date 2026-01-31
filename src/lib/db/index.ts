/**
 * Database exports
 */

// Client
export { db } from "./client";
// Queries
export * from "./queries";
// Schema & types
export * from "./schema";

// ============================================
// Address extraction helper
// ============================================

export interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

export function extractAddressFields(components: AddressComponent[]) {
  const find = (type: string) => components.find((c) => c.types?.includes(type));

  return {
    city: find("locality")?.shortText ?? find("postal_town")?.shortText ?? null,
    region: find("administrative_area_level_1")?.shortText ?? null,
    country: find("country")?.shortText ?? null,
    postalCode: find("postal_code")?.shortText ?? null,
  };
}
