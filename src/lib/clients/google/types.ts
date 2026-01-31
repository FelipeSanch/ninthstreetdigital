/**
 * Google Places API Types
 */

export interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

export type PriceLevel =
  | "PRICE_LEVEL_FREE"
  | "PRICE_LEVEL_INEXPENSIVE"
  | "PRICE_LEVEL_MODERATE"
  | "PRICE_LEVEL_EXPENSIVE"
  | "PRICE_LEVEL_VERY_EXPENSIVE";

export type BusinessStatus =
  | "OPERATIONAL"
  | "CLOSED_TEMPORARILY"
  | "CLOSED_PERMANENTLY";

export interface Place {
  id: string;
  displayName?: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: PriceLevel;
  businessStatus?: BusinessStatus;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface TextSearchRequest {
  textQuery: string;
  maxResultCount?: number;
  locationBias?: {
    circle?: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
    rectangle?: {
      low: { latitude: number; longitude: number };
      high: { latitude: number; longitude: number };
    };
  };
  locationRestriction?: {
    rectangle: {
      low: { latitude: number; longitude: number };
      high: { latitude: number; longitude: number };
    };
  };
  includedType?: string;
  minRating?: number;
  openNow?: boolean;
  priceLevels?: PriceLevel[];
  rankPreference?: "DISTANCE" | "RELEVANCE";
}

export interface TextSearchResponse {
  places: Place[];
  nextPageToken?: string;
}

export interface NearbySearchRequest {
  location: { latitude: number; longitude: number };
  radius: number;
  includedTypes?: string[];
  maxResultCount?: number;
}

export interface PaginationOptions {
  allPages?: boolean;
  maxPages?: number;
}
