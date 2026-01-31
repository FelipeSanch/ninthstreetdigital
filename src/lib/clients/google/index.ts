/**
 * Google Places API Client
 */

import { FieldMasks } from "./constants";
import type {
  NearbySearchRequest,
  PaginationOptions,
  Place,
  TextSearchRequest,
  TextSearchResponse,
} from "./types";

export * from "./constants";
// Re-export types and constants
export * from "./types";

const BASE_URL = "https://places.googleapis.com/v1";

export class GooglePlacesClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      throw new Error("GOOGLE_MAPS_API_KEY is required");
    }
    this.apiKey = key;
  }

  /**
   * Text search for places (single page)
   */
  async searchText(
    request: TextSearchRequest,
    fields: string = FieldMasks.enterprise,
  ): Promise<TextSearchResponse> {
    const response = await fetch(`${BASE_URL}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": fields,
      },
      body: JSON.stringify({
        textQuery: request.textQuery,
        maxResultCount: request.maxResultCount ?? 20,
        locationBias: request.locationBias,
        locationRestriction: request.locationRestriction,
        includedType: request.includedType,
        minRating: request.minRating,
        openNow: request.openNow,
        priceLevels: request.priceLevels,
        rankPreference: request.rankPreference,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Places API error: ${response.status} - ${error}`);
    }

    return (await response.json()) as TextSearchResponse;
  }

  /**
   * Text search with pagination
   * Returns all pages (up to 60 results) or maxPages worth
   */
  async searchTextAll(
    request: TextSearchRequest,
    options?: PaginationOptions,
    fields: string = FieldMasks.enterprise,
  ): Promise<{ places: Place[]; pagesFetched: number }> {
    const allPlaces: Place[] = [];
    let pagesFetched = 0;
    let nextPageToken: string | undefined;
    const maxPages = options?.maxPages ?? (options?.allPages ? 3 : 1);

    do {
      const response = await fetch(`${BASE_URL}/places:searchText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": fields,
        },
        body: JSON.stringify({
          textQuery: request.textQuery,
          maxResultCount: request.maxResultCount ?? 20,
          locationBias: request.locationBias,
          locationRestriction: request.locationRestriction,
          includedType: request.includedType,
          minRating: request.minRating,
          openNow: request.openNow,
          priceLevels: request.priceLevels,
          rankPreference: request.rankPreference,
          pageToken: nextPageToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Places API error: ${response.status} - ${error}`);
      }

      const data = (await response.json()) as TextSearchResponse;
      allPlaces.push(...(data.places ?? []));
      pagesFetched++;
      nextPageToken = data.nextPageToken;
    } while (nextPageToken && pagesFetched < maxPages);

    return { places: allPlaces, pagesFetched };
  }

  /**
   * Nearby search
   */
  async searchNearby(
    request: NearbySearchRequest,
    fields: string = FieldMasks.enterprise,
  ): Promise<TextSearchResponse> {
    const response = await fetch(`${BASE_URL}/places:searchNearby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": fields,
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: request.location,
            radius: request.radius,
          },
        },
        includedTypes: request.includedTypes,
        maxResultCount: request.maxResultCount ?? 20,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Places API error: ${response.status} - ${error}`);
    }

    return (await response.json()) as TextSearchResponse;
  }

  /**
   * Get place details by ID
   */
  async getPlace(
    placeId: string,
    fields: string = FieldMasks.enterprise.replace(/places\./g, ""),
  ): Promise<Place> {
    const response = await fetch(`${BASE_URL}/places/${placeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": fields,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Places API error: ${response.status} - ${error}`);
    }

    return (await response.json()) as Place;
  }
}

export function createGooglePlacesClient(apiKey?: string): GooglePlacesClient {
  return new GooglePlacesClient(apiKey);
}
