/**
 * Database Queries
 */

import { and, desc, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "./client";
import * as schema from "./schema";

// ============================================
// Place operations
// ============================================

export async function upsertPlace(place: schema.NewPlace) {
  return db
    .insert(schema.places)
    .values(place)
    .onConflictDoUpdate({
      target: schema.places.id,
      set: {
        displayName: place.displayName,
        formattedAddress: place.formattedAddress,
        city: place.city,
        region: place.region,
        country: place.country,
        postalCode: place.postalCode,
        locationLat: place.locationLat,
        locationLng: place.locationLng,
        primaryType: place.primaryType,
        types: place.types,
        businessStatus: place.businessStatus,
        googleMapsUri: place.googleMapsUri,
        phone: place.phone,
        websiteUri: place.websiteUri,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        priceLevel: place.priceLevel,
        updatedAt: sql`(unixepoch())`,
      },
    });
}

export async function upsertPlaces(places: schema.NewPlace[]) {
  for (const place of places) {
    await upsertPlace(place);
  }
}

export async function getPlaceById(id: string) {
  return db.query.places.findFirst({
    where: eq(schema.places.id, id),
  });
}

// ============================================
// Search operations
// ============================================

export interface SearchParams {
  textQuery: string;
  includedType?: string;
}

export async function findSearch(params: SearchParams) {
  const conditions = [eq(schema.placeSearches.textQuery, params.textQuery)];

  if (params.includedType) {
    conditions.push(eq(schema.placeSearches.includedType, params.includedType));
  } else {
    conditions.push(isNull(schema.placeSearches.includedType));
  }

  return db.query.placeSearches.findFirst({
    where: and(...conditions),
    orderBy: desc(schema.placeSearches.searchedAt),
  });
}

export async function insertSearch(search: schema.NewPlaceSearch) {
  const result = await db
    .insert(schema.placeSearches)
    .values(search)
    .returning();
  if (!result[0]) {
    throw new Error("Failed to insert search");
  }
  return result[0];
}

export async function linkSearchToPlace(searchId: number, placeId: string) {
  return db
    .insert(schema.placeSearchResults)
    .values({ searchId, placeId })
    .onConflictDoNothing();
}

export async function getPlacesFromSearch(searchId: number) {
  const results = await db
    .select()
    .from(schema.places)
    .innerJoin(
      schema.placeSearchResults,
      eq(schema.places.id, schema.placeSearchResults.placeId),
    )
    .where(eq(schema.placeSearchResults.searchId, searchId));

  return results.map((r) => r.places);
}

// ============================================
// Lead queries
// ============================================

export async function getLeadsWithoutWebsite(options?: {
  country?: string;
  region?: string;
  city?: string;
  minRating?: number;
  limit?: number;
}) {
  const conditions = [isNull(schema.places.websiteUri)];

  if (options?.country) {
    conditions.push(eq(schema.places.country, options.country));
  }
  if (options?.region) {
    conditions.push(eq(schema.places.region, options.region));
  }
  if (options?.city) {
    conditions.push(eq(schema.places.city, options.city));
  }
  if (options?.minRating) {
    conditions.push(gte(schema.places.rating, options.minRating));
  }

  let query = db
    .select()
    .from(schema.places)
    .where(and(...conditions))
    .orderBy(desc(schema.places.rating), desc(schema.places.userRatingCount));

  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }

  return query;
}

export async function getLeadsWithWebsite(options?: {
  country?: string;
  region?: string;
  city?: string;
  minRating?: number;
  limit?: number;
}) {
  const conditions = [isNotNull(schema.places.websiteUri)];

  if (options?.country) {
    conditions.push(eq(schema.places.country, options.country));
  }
  if (options?.region) {
    conditions.push(eq(schema.places.region, options.region));
  }
  if (options?.city) {
    conditions.push(eq(schema.places.city, options.city));
  }
  if (options?.minRating) {
    conditions.push(gte(schema.places.rating, options.minRating));
  }

  let query = db
    .select()
    .from(schema.places)
    .where(and(...conditions))
    .orderBy(desc(schema.places.rating), desc(schema.places.userRatingCount));

  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }

  return query;
}

export async function getAllPlaces(options?: {
  country?: string;
  region?: string;
  hasWebsite?: boolean;
  limit?: number;
}) {
  const conditions: ReturnType<typeof eq>[] = [];

  if (options?.country) {
    conditions.push(eq(schema.places.country, options.country));
  }
  if (options?.region) {
    conditions.push(eq(schema.places.region, options.region));
  }
  if (options?.hasWebsite === true) {
    conditions.push(isNotNull(schema.places.websiteUri));
  } else if (options?.hasWebsite === false) {
    conditions.push(isNull(schema.places.websiteUri));
  }

  let query = db
    .select()
    .from(schema.places)
    .orderBy(desc(schema.places.rating), desc(schema.places.userRatingCount));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }

  return query;
}

// ============================================
// Draft operations
// ============================================

export async function insertDraft(draft: schema.NewDraft) {
  const result = await db
    .insert(schema.drafts)
    .values(draft)
    .returning();
  return result[0];
}

export async function getDraftByPlaceId(placeId: string) {
  return db.query.drafts.findFirst({
    where: eq(schema.drafts.placeId, placeId),
    orderBy: desc(schema.drafts.createdAt),
  });
}

export async function getDraftsForBatch(batchId: string) {
  return db
    .select()
    .from(schema.drafts)
    .where(eq(schema.drafts.batchId, batchId))
    .orderBy(desc(schema.drafts.createdAt));
}

// ============================================
// Stats
// ============================================

export async function getStats() {
  const totalPlaces = await db.$count(schema.places);
  const withWebsite = await db.$count(
    schema.places,
    isNotNull(schema.places.websiteUri),
  );
  const withoutWebsite = await db.$count(
    schema.places,
    isNull(schema.places.websiteUri),
  );
  const totalSearches = await db.$count(schema.placeSearches);

  return { totalPlaces, withWebsite, withoutWebsite, totalSearches };
}
