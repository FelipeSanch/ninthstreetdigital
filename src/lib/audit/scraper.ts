/**
 * Website scraper - extracts emails, contact info, and site quality signals
 */

export interface ScrapeResult {
  url: string;
  success: boolean;
  error?: string;

  // Contact info
  emails: string[];
  phoneNumbers: string[];
  socialLinks: Record<string, string>; // { facebook: url, instagram: url, ... }

  // Site quality signals
  https: boolean;
  hasViewport: boolean;
  generator: string | null; // "WordPress 6.4", "Wix", etc.
  freeSubdomain: boolean;
  copyrightYear: number | null;
  serverHeader: string | null;
  hasSitemap: boolean;
  hasStructuredData: boolean;

  // Performance
  loadTimeMs: number | null;
  pageSize: number | null;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const COPYRIGHT_REGEX = /(?:©|&copy;|copyright)\s*(\d{4})/gi;

const CONTACT_PATHS = ["/contact", "/contact-us", "/about", "/about-us"];

const FREE_SUBDOMAINS = [
  ".wixsite.com",
  ".weebly.com",
  ".squarespace.com",
  ".wordpress.com",
  ".blogspot.com",
  ".godaddysites.com",
  ".edan.io",
  ".carrd.co",
  ".webflow.io",
  ".netlify.app",
  ".vercel.app",
  ".myshopify.com",
  ".wix.com",
];

const SOCIAL_PATTERNS: [string, RegExp][] = [
  ["facebook", /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^\s"'<>]+/i],
  ["instagram", /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s"'<>]+/i],
  ["twitter", /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/[^\s"'<>]+/i],
  ["linkedin", /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s"'<>]+/i],
  ["yelp", /(?:https?:\/\/)?(?:www\.)?yelp\.com\/[^\s"'<>]+/i],
  ["youtube", /(?:https?:\/\/)?(?:www\.)?youtube\.com\/[^\s"'<>]+/i],
  ["tiktok", /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/[^\s"'<>]+/i],
];

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; SiteAuditBot/1.0; +https://example.com/bot)",
};

/**
 * Scrape a website for contact info and quality signals
 */
export async function scrapeWebsite(url: string): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    url,
    success: false,
    emails: [],
    phoneNumbers: [],
    socialLinks: {},
    https: false,
    hasViewport: false,
    generator: null,
    freeSubdomain: false,
    copyrightYear: null,
    serverHeader: null,
    hasSitemap: false,
    hasStructuredData: false,
    loadTimeMs: null,
    pageSize: null,
  };

  try {
    // Normalize URL
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Check free subdomain
    const hostname = new URL(normalizedUrl).hostname;
    result.freeSubdomain = FREE_SUBDOMAINS.some((sub) =>
      hostname.endsWith(sub)
    );

    // Fetch main page
    const start = Date.now();
    const response = await fetch(normalizedUrl, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    result.loadTimeMs = Date.now() - start;

    // HTTPS check (after redirects)
    result.https = response.url.startsWith("https://");

    // Server header
    result.serverHeader = response.headers.get("server");

    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    const html = await response.text();
    result.pageSize = html.length;
    result.success = true;

    // Extract from main page
    extractFromHtml(html, result);

    // Check sitemap.xml and contact pages in parallel
    const baseUrl = new URL(response.url).origin;
    const sitemapCheck = checkSitemap(baseUrl);
    const contactChecks = CONTACT_PATHS.map(async (path) => {
      try {
        const contactHtml = await fetchPage(`${baseUrl}${path}`);
        if (contactHtml) extractEmails(contactHtml, result);
      } catch {
        // ignore
      }
    });

    await Promise.all([sitemapCheck, ...contactChecks]);
    result.hasSitemap = await sitemapCheck;

    // Dedupe everything
    result.emails = [...new Set(result.emails)].filter(isValidEmail);
    result.phoneNumbers = [...new Set(result.phoneNumbers)];
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
  }

  return result;
}

/**
 * Check if sitemap.xml exists
 */
async function checkSitemap(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/sitemap.xml`, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch a page with timeout
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      return await response.text();
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Extract all info from HTML
 */
function extractFromHtml(html: string, result: ScrapeResult): void {
  // Viewport meta tag
  result.hasViewport = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);

  // Generator meta tag (CMS detection)
  const generatorMatch = html.match(
    /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i
  );
  result.generator = generatorMatch?.[1]?.trim() ?? null;

  // Structured data (JSON-LD or microdata)
  result.hasStructuredData =
    /<script[^>]+type=["']application\/ld\+json["']/i.test(html) ||
    /itemtype=["']https?:\/\/schema\.org/i.test(html);

  // Copyright year (find the most recent one)
  const copyrightMatches = [...html.matchAll(COPYRIGHT_REGEX)];
  if (copyrightMatches.length > 0) {
    const years = copyrightMatches
      .map((m) => parseInt(m[1] ?? "0", 10))
      .filter((y) => y >= 2000 && y <= 2030);
    if (years.length > 0) {
      result.copyrightYear = Math.max(...years);
    }
  }

  // Social media links
  for (const [platform, regex] of SOCIAL_PATTERNS) {
    const match = html.match(regex);
    if (match?.[0]) {
      let socialUrl = match[0];
      if (!socialUrl.startsWith("http")) socialUrl = `https://${socialUrl}`;
      result.socialLinks[platform] = socialUrl;
    }
  }

  // Emails and phone numbers
  extractEmails(html, result);
  extractPhones(html, result);
}

/**
 * Extract emails from text/HTML
 */
function extractEmails(text: string, result: ScrapeResult): void {
  // From mailto: links
  const mailtoMatches = text.match(/mailto:([^"'\s?]+)/gi) ?? [];
  for (const match of mailtoMatches) {
    const email = match.replace(/^mailto:/i, "").split("?")[0];
    if (email) result.emails.push(email.toLowerCase());
  }

  // From raw text
  const textMatches = text.match(EMAIL_REGEX) ?? [];
  for (const email of textMatches) {
    result.emails.push(email.toLowerCase());
  }
}

/**
 * Extract phone numbers from text/HTML
 */
function extractPhones(text: string, result: ScrapeResult): void {
  // From tel: links
  const telMatches = text.match(/href=["']tel:([^"']+)["']/gi) ?? [];
  for (const match of telMatches) {
    const phone = match.replace(/href=["']tel:/i, "").replace(/["']/g, "");
    if (phone) result.phoneNumbers.push(phone);
  }

  // From raw text (only from visible-ish areas, not scripts)
  const stripped = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  const phoneMatches = stripped.match(PHONE_REGEX) ?? [];
  for (const phone of phoneMatches) {
    result.phoneNumbers.push(phone.trim());
  }
}

/**
 * Filter out invalid/fake emails
 */
function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase();

  // Filter image filenames (name@2x.png, etc)
  if (/@\d+(\.\d+)?x/i.test(lower)) return false;
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(lower)) return false;

  // Filter common false positives
  const blacklist = [
    "example.com",
    "domain.com",
    "email.com",
    "yoursite.com",
    "website.com",
    "sentry.io",
    "wixpress.com",
    "w3.org",
    "schema.org",
    "googleapis.com",
    "gstatic.com",
    "wordpress.org",
    "wordpress.com",
    "gravatar.com",
  ];

  if (blacklist.some((b) => lower.includes(b))) return false;
  if (lower.length < 6 || lower.length > 100) return false;

  // Must have valid TLD
  const tldMatch = lower.match(/\.([a-z]{2,})$/);
  if (!tldMatch) return false;

  return true;
}
