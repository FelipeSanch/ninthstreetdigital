import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const placeSearches = sqliteTable("place_searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  textQuery: text("text_query").notNull(),
  includedType: text("included_type"),
  minRating: real("min_rating"),
  locationBiasLat: real("location_bias_lat"),
  locationBiasLng: real("location_bias_lng"),
  locationBiasRadius: real("location_bias_radius"),
  resultCount: integer("result_count"),
  searchedAt: integer("searched_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});

export const places = sqliteTable("places", {
  // Google Place ID
  id: text("id").primaryKey(),
  displayName: text("display_name"),
  formattedAddress: text("formatted_address"),

  // Location
  city: text("city"),
  region: text("region"),
  country: text("country").default("US"),
  postalCode: text("postal_code"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),

  // Business info
  primaryType: text("primary_type"),
  types: text("types", { mode: "json" }).$type<string[]>(),
  businessStatus: text("business_status"),
  googleMapsUri: text("google_maps_uri"),

  // Lead gen fields
  phone: text("phone"),
  websiteUri: text("website_uri"),
  rating: real("rating"),
  userRatingCount: integer("user_rating_count"),
  priceLevel: text("price_level"),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});

export const placeSearchResults = sqliteTable(
  "place_search_results",
  {
    searchId: integer("search_id").references(() => placeSearches.id),
    placeId: text("place_id").references(() => places.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.searchId, table.placeId] }),
  }),
);

export const siteAudits = sqliteTable("site_audits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  placeId: text("place_id").references(() => places.id),
  url: text("url").notNull(),

  // Scrape status
  success: integer("success", { mode: "boolean" }).notNull(),
  error: text("error"),

  // Contact info
  emails: text("emails", { mode: "json" }).$type<string[]>(),
  phoneNumbers: text("phone_numbers", { mode: "json" }).$type<string[]>(),
  socialLinks: text("social_links", { mode: "json" }).$type<Record<string, string>>(),

  // Site quality signals
  https: integer("https", { mode: "boolean" }),
  hasViewport: integer("has_viewport", { mode: "boolean" }),
  generator: text("generator"), // "WordPress 6.4", "Wix", etc.
  freeSubdomain: integer("free_subdomain", { mode: "boolean" }),
  copyrightYear: integer("copyright_year"),
  serverHeader: text("server_header"),
  hasSitemap: integer("has_sitemap", { mode: "boolean" }),
  hasStructuredData: integer("has_structured_data", { mode: "boolean" }),

  // Performance
  loadTimeMs: integer("load_time_ms"),
  pageSize: integer("page_size"),

  // Timestamps
  scrapedAt: integer("scraped_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

// Types
export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type PlaceSearch = typeof placeSearches.$inferSelect;
export type NewPlaceSearch = typeof placeSearches.$inferInsert;
export type SiteAudit = typeof siteAudits.$inferSelect;
export type NewSiteAudit = typeof siteAudits.$inferInsert;
