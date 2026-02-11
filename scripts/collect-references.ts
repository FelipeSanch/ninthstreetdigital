#!/usr/bin/env bun
/**
 * Collect high-quality reference businesses for each category
 * Searches major cities for top-rated businesses with great websites
 */

import Database from "bun:sqlite";
import { chromium, type Page } from "playwright";

const db = new Database("leads.db");
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

const MAJOR_CITIES = [
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { name: "Miami", lat: 25.7617, lng: -80.1918 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "Seattle", lat: 47.6062, lng: -122.3321 },
  { name: "Austin", lat: 30.2672, lng: -97.7431 },
  { name: "Denver", lat: 39.7392, lng: -104.9903 },
];

const TOP_CATEGORIES = [
  "plumber",
  "electrician", 
  "roofing_contractor",
  "general_contractor",
  "painter",
  "moving_company",
  "car_repair",
  "chiropractor",
  "dentist",
  "barber_shop",
  "locksmith",
  "hvac_contractor",
  "landscaper",
  "pest_control",
  "cleaning_service",
];

interface Place {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
}

async function searchPlaces(category: string, city: typeof MAJOR_CITIES[0]): Promise<Place[]> {
  const searchTerm = category.replace(/_/g, " ");
  const url = "https://places.googleapis.com/v1/places:searchText";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri",
    },
    body: JSON.stringify({
      textQuery: `best ${searchTerm} in ${city.name}`,
      locationBias: {
        circle: {
          center: { latitude: city.lat, longitude: city.lng },
          radius: 30000, // 30km radius
        },
      },
      maxResultCount: 10,
    }),
  });

  if (!response.ok) {
    console.error(`API error for ${category} in ${city.name}: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return data.places || [];
}

async function analyzeWebsite(page: Page, url: string, category: string): Promise<{
  screenshot: Buffer | null;
  analysis: string;
  colorScheme: string;
  designNotes: string;
} | null> {
  try {
    await page.goto(url, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000); // Let animations settle
    
    // Take screenshot of hero section
    const screenshot = await page.screenshot({ 
      clip: { x: 0, y: 0, width: 1440, height: 900 },
      type: "jpeg",
      quality: 80,
    });
    
    // Extract colors from CSS
    const colors = await page.evaluate(() => {
      const styles = getComputedStyle(document.body);
      const extractColor = (prop: string) => styles.getPropertyValue(prop) || "";
      
      // Try to find primary colors
      const allElements = document.querySelectorAll("*");
      const colorSet = new Set<string>();
      
      allElements.forEach((el) => {
        const style = getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
          colorSet.add(bg);
        }
        if (color) colorSet.add(color);
      });
      
      return Array.from(colorSet).slice(0, 10).join(", ");
    });
    
    // Basic page structure analysis
    const structure = await page.evaluate(() => {
      const hasHero = !!document.querySelector("[class*='hero'], [class*='banner'], header");
      const hasTestimonials = !!document.querySelector("[class*='testimonial'], [class*='review']");
      const hasServices = !!document.querySelector("[class*='service']");
      const hasCTA = !!document.querySelectorAll("a[href*='contact'], button").length;
      const hasPhone = !!document.body.innerText.match(/\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/);
      
      return { hasHero, hasTestimonials, hasServices, hasCTA, hasPhone };
    });
    
    const designNotes = [
      structure.hasHero ? "✓ Strong hero section" : "✗ Weak/no hero",
      structure.hasTestimonials ? "✓ Has testimonials" : "✗ No testimonials",
      structure.hasServices ? "✓ Services section" : "✗ No services section",
      structure.hasCTA ? "✓ Clear CTAs" : "✗ Weak CTAs",
      structure.hasPhone ? "✓ Phone visible" : "✗ Phone not prominent",
    ].join("\n");
    
    return {
      screenshot,
      analysis: JSON.stringify(structure),
      colorScheme: colors,
      designNotes,
    };
  } catch (e) {
    console.error(`Failed to analyze ${url}: ${e}`);
    return null;
  }
}

async function main() {
  console.log("🔍 Starting reference site collection...\n");
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  let totalCollected = 0;
  
  for (const category of TOP_CATEGORIES) {
    console.log(`\n📂 Category: ${category}`);
    
    // Check existing count
    const existing = db.query<{ cnt: number }, []>(
      "SELECT COUNT(*) as cnt FROM reference_sites WHERE category = ?"
    ).get(category);
    
    if (existing && existing.cnt >= 5) {
      console.log(`  Already have ${existing.cnt} references, skipping...`);
      continue;
    }
    
    const candidates: Place[] = [];
    
    // Search in 3 random major cities
    const cities = MAJOR_CITIES.sort(() => Math.random() - 0.5).slice(0, 3);
    
    for (const city of cities) {
      console.log(`  Searching ${city.name}...`);
      const places = await searchPlaces(category, city);
      
      // Filter: 4.5+ rating, 50+ reviews, has website
      const qualified = places.filter(p => 
        p.rating && p.rating >= 4.5 &&
        p.userRatingCount && p.userRatingCount >= 50 &&
        p.websiteUri
      );
      
      console.log(`    Found ${qualified.length} qualified (of ${places.length})`);
      candidates.push(...qualified.map(p => ({ ...p, city: city.name })));
      
      await Bun.sleep(500); // Rate limit
    }
    
    // Sort by rating * log(reviews) and take top 5
    const ranked = candidates
      .sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log10((a.userRatingCount || 1) + 1);
        const scoreB = (b.rating || 0) * Math.log10((b.userRatingCount || 1) + 1);
        return scoreB - scoreA;
      })
      .slice(0, 5);
    
    console.log(`  Analyzing top ${ranked.length} websites...`);
    
    for (const place of ranked) {
      if (!place.websiteUri) continue;
      
      console.log(`    → ${place.displayName.text} (${place.rating}★, ${place.userRatingCount} reviews)`);
      
      const analysis = await analyzeWebsite(page, place.websiteUri, category);
      
      if (analysis) {
        // Save screenshot
        const screenshotPath = `reference-sites/screenshots/${category}-${Date.now()}.jpg`;
        await Bun.write(screenshotPath, analysis.screenshot!);
        
        // Insert into DB
        db.run(`
          INSERT INTO reference_sites 
          (category, business_name, city, rating, review_count, website_url, google_maps_uri, screenshot_path, analysis, design_notes, color_scheme)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          category,
          place.displayName.text,
          (place as any).city,
          place.rating,
          place.userRatingCount,
          place.websiteUri,
          place.googleMapsUri,
          screenshotPath,
          analysis.analysis,
          analysis.designNotes,
          analysis.colorScheme,
        ]);
        
        totalCollected++;
        console.log(`      ✓ Saved`);
      }
      
      await Bun.sleep(1000); // Be nice to websites
    }
  }
  
  await browser.close();
  
  console.log(`\n✅ Done! Collected ${totalCollected} reference sites.`);
  
  // Summary
  const summary = db.query<{ category: string; cnt: number }, []>(
    "SELECT category, COUNT(*) as cnt FROM reference_sites GROUP BY category ORDER BY cnt DESC"
  ).all();
  
  console.log("\n📊 Reference sites by category:");
  for (const row of summary) {
    console.log(`  ${row.category}: ${row.cnt}`);
  }
}

main().catch(console.error);
