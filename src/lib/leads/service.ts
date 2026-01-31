/**
 * Lead Service
 * Handles caching and DB operations for leads
 */

import * as clients from "../clients";
import * as db from "../db";

type Place = db.Place;
type NewPlace = db.NewPlace;

export class LeadService {
  private client: clients.google.GooglePlacesClient;

  constructor(apiKey?: string) {
    this.client = clients.google.createGooglePlacesClient(apiKey);
  }

  /**
   * Search for places with caching
   * Returns cached results if search exists
   */
  async search(
    request: clients.google.TextSearchRequest,
    options?: { skipCache?: boolean } & clients.google.PaginationOptions,
  ): Promise<{ places: Place[]; cached: boolean; pagesFetched?: number }> {
    // Check cache
    if (!options?.skipCache) {
      const existingSearch = await db.findSearch({
        textQuery: request.textQuery,
        includedType: request.includedType,
      });
      if (existingSearch) {
        const cachedPlaces = await db.getPlacesFromSearch(existingSearch.id);
        return { places: cachedPlaces, cached: true };
      }
    }

    // Fetch from API (with pagination if requested)
    const usePagination = options?.allPages || options?.maxPages;
    const response = usePagination
      ? await this.client.searchTextAll(request, options)
      : await this.client.searchText(request);

    const apiPlaces = response.places ?? [];
    const pagesFetched = "pagesFetched" in response ? response.pagesFetched : 1;

    // Store search
    const search = await db.insertSearch({
      textQuery: request.textQuery,
      includedType: request.includedType,
      minRating: request.minRating,
      locationBiasLat: request.locationBias?.circle?.center.latitude,
      locationBiasLng: request.locationBias?.circle?.center.longitude,
      locationBiasRadius: request.locationBias?.circle?.radius,
      resultCount: apiPlaces.length,
    });

    // Convert and store places
    const dbPlaces = await Promise.all(
      apiPlaces.map(async (apiPlace) => {
        const dbPlace = this.toDbPlace(apiPlace);
        await db.upsertPlace(dbPlace);
        await db.linkSearchToPlace(search.id, dbPlace.id);
        return dbPlace as Place;
      }),
    );

    return { places: dbPlaces, cached: false, pagesFetched };
  }

  /**
   * Convert API place to DB schema
   */
  private toDbPlace(apiPlace: clients.google.Place): NewPlace {
    const addr = apiPlace.addressComponents
      ? db.extractAddressFields(apiPlace.addressComponents)
      : { city: null, region: null, country: "US", postalCode: null };

    return {
      id: apiPlace.id,
      displayName: apiPlace.displayName?.text ?? null,
      formattedAddress: apiPlace.formattedAddress ?? null,
      city: addr.city,
      region: addr.region,
      country: addr.country ?? "US",
      postalCode: addr.postalCode,
      locationLat: apiPlace.location?.latitude ?? null,
      locationLng: apiPlace.location?.longitude ?? null,
      primaryType: apiPlace.primaryType ?? null,
      types: apiPlace.types ?? null,
      businessStatus: apiPlace.businessStatus ?? null,
      googleMapsUri: apiPlace.googleMapsUri ?? null,
      phone: apiPlace.internationalPhoneNumber ?? null,
      websiteUri: apiPlace.websiteUri ?? null,
      rating: apiPlace.rating ?? null,
      userRatingCount: apiPlace.userRatingCount ?? null,
      priceLevel: apiPlace.priceLevel ?? null,
    };
  }
}
