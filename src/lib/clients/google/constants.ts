/**
 * Google Places API Constants
 *
 * Place types from Table A - usable for filtering in Text Search and Nearby Search.
 * @see https://developers.google.com/maps/documentation/places/web-service/place-types
 */

export const PlaceTypes = {
  homeServices: [
    "plumber",
    "electrician",
    "roofing_contractor",
    "painter",
    "moving_company",
    "locksmith",
    "general_contractor",
    "hvac_contractor",
  ],

  auto: ["car_repair", "car_wash", "auto_body_shop", "car_dealer", "tire_shop"],

  personal: ["barber_shop", "beauty_salon", "hair_salon", "nail_salon", "spa"],

  professional: [
    "lawyer",
    "accounting",
    "insurance_agency",
    "real_estate_agency",
  ],

  local: [
    "florist",
    "tailor",
    "pet_store",
    "veterinary_care",
    "dry_cleaning",
    "laundry",
    "funeral_home",
    "storage",
  ],

  food: ["restaurant", "cafe", "bakery", "bar", "coffee_shop"],

  health: ["dentist", "doctor", "pharmacy", "physiotherapist"],

  fitness: ["gym", "yoga_studio"],

  lodging: ["hotel", "motel", "bed_and_breakfast", "campground"],
} as const;

export const AllPlaceTypes = Object.values(PlaceTypes).flat();

export type PlaceType = (typeof AllPlaceTypes)[number];

// Field masks by pricing tier
export const FieldMasks = {
  // Enterprise tier - includes phone, website, rating, priceLevel ($35/1k)
  enterprise: [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.addressComponents",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.googleMapsUri",
    "places.primaryType",
    "places.types",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.businessStatus",
    "places.location",
  ].join(","),

  // Pro tier - no phone, website, rating ($32/1k)
  pro: [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.addressComponents",
    "places.googleMapsUri",
    "places.primaryType",
    "places.types",
    "places.businessStatus",
    "places.location",
  ].join(","),

  // IDs only - cheapest
  ids: ["places.id", "places.displayName"].join(","),
} as const;
