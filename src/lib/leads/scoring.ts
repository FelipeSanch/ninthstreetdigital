/**
 * Lead Scoring Algorithm
 *
 * TODO: Build proper scoring algorithm once we have data to analyze.
 * For now, this is a placeholder with basic heuristics.
 */

import type { Place } from "../db";

export interface ScoredLead extends Place {
  hasWebsite: boolean;
  leadScore: number;
}

/**
 * TODO: Replace with data-driven scoring once we have leads to analyze.
 * Current logic is just a guess.
 */
export function scoreLeads(places: Place[]): ScoredLead[] {
  return places.map((place) => {
    let score = 0;
    const hasWebsite = !!place.websiteUri;

    // TODO: These weights are arbitrary - tune with real data
    if (!hasWebsite) score += 50;
    if (place.phone) score += 10;
    if (place.rating && place.rating >= 4.0) score += 10;
    if (
      place.userRatingCount &&
      place.userRatingCount >= 10 &&
      place.userRatingCount < 500
    )
      score += 20;
    if (place.businessStatus === "OPERATIONAL") score += 5;
    if (
      place.priceLevel === "PRICE_LEVEL_INEXPENSIVE" ||
      place.priceLevel === "PRICE_LEVEL_FREE"
    )
      score += 5;

    return { ...place, hasWebsite, leadScore: score };
  });
}

export function getTopLeads(places: Place[], minScore = 30): ScoredLead[] {
  return scoreLeads(places)
    .filter((lead) => lead.leadScore >= minScore)
    .sort((a, b) => b.leadScore - a.leadScore);
}
