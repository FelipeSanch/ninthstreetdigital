/**
 * Cold outreach sender for NSD
 * Usage: bun run outreach/send.ts --limit 5 --dry-run
 */

import Database from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = join(import.meta.dir, "..", "leads.db");
const TEMPLATE_PATH = join(import.meta.dir, "templates", "cold-intro.html");
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "jose@mail.ninthstreetdigital.com";
const FROM_NAME = "Jose from Ninth Street Digital";

interface Lead {
  id: string;
  display_name: string;
  primary_type: string | null;
  city: string;
  region: string;
  website_uri: string;
  phone: string;
  emails: string;
  free_subdomain: number;
  https: number;
  has_viewport: number;
  load_time_ms: number;
  copyright_year: number | null;
  generator: string | null;
  draft_url: string;
}

function getAuditNotes(lead: Lead): string {
  const issues: string[] = [];

  if (lead.free_subdomain) {
    issues.push("your site is on a free subdomain — that can hurt credibility with customers");
  }
  if (!lead.https) {
    issues.push("your site doesn't have HTTPS, which means browsers show a 'Not Secure' warning");
  }
  if (lead.load_time_ms > 2000) {
    issues.push(`your page takes about ${(lead.load_time_ms / 1000).toFixed(1)} seconds to load (customers expect under 2 seconds)`);
  }
  if (lead.copyright_year && lead.copyright_year < 2023) {
    issues.push(`the site footer shows ${lead.copyright_year}, which can make it look outdated`);
  }
  if (!lead.has_viewport) {
    issues.push("the site isn't optimized for mobile devices");
  }
  if (lead.generator?.includes("Wix")) {
    issues.push("it's built on Wix, which limits your customization and can feel generic");
  }
  if (lead.generator?.includes("GoDaddy")) {
    issues.push("it's using GoDaddy's website builder, which is pretty limited for growing businesses");
  }
  if (lead.generator?.includes("Weebly")) {
    issues.push("it's on Weebly, which has limited design flexibility");
  }

  if (issues.length === 0) {
    return "There are a few areas where a modern redesign could help you stand out and convert more visitors into customers.";
  }

  const formatted = issues.slice(0, 3).map((issue, i) => {
    if (i === 0) return issue.charAt(0).toUpperCase() + issue.slice(1);
    return issue;
  });

  return formatted.join(", and ") + ". Small improvements that can make a real difference.";
}

function getFirstName(displayName: string): string {
  // Try to extract owner name, fall back to generic
  return "there";
}

function renderTemplate(lead: Lead): { subject: string; html: string } {
  let html = readFileSync(TEMPLATE_PATH, "utf-8");
  const data: Record<string, string> = {
    OWNER_NAME: getFirstName(lead.display_name),
    BUSINESS_NAME: lead.display_name,
    DRAFT_URL: lead.draft_url,
    AUDIT_NOTES: getAuditNotes(lead),
  };

  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  return {
    subject: `I built a free website draft for ${lead.display_name}`,
    html,
  };
}

function getLeadEmail(emailsJson: string): string | null {
  try {
    const emails = JSON.parse(emailsJson) as string[];
    // Filter out generic/spam emails and invalid formats
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const filtered = emails.filter(
      (e) =>
        emailRegex.test(e) &&
        !e.includes("godaddy") &&
        !e.includes("filler@") &&
        !e.includes("latofonts") &&
        !e.includes("surgedigital") &&
        !e.includes("mysite.com") &&
        !e.includes("example@") &&
        !e.includes("cleanmate.com")
    );
    return filtered[0] || null;
  } catch {
    return null;
  }
}

/**
 * Get a random send time during business hours (9am-2pm ET).
 * If we're already in the window, schedule for today.
 * Otherwise, schedule for the next weekday in the window.
 */
function getScheduledTime(): string {
  const now = new Date();

  // Convert to ET
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hour = etNow.getHours();
  const day = etNow.getDay(); // 0=Sun, 6=Sat

  // Start from tomorrow at a random time in the window
  let scheduleDate = new Date(etNow);

  // If it's before 2pm ET on a weekday, we could schedule for today
  // But to spread them out, always schedule for next business day
  scheduleDate.setDate(scheduleDate.getDate() + 1);

  // Skip weekends
  while (scheduleDate.getDay() === 0 || scheduleDate.getDay() === 6) {
    scheduleDate.setDate(scheduleDate.getDate() + 1);
  }

  // Random time between 9:00 AM and 1:59 PM ET
  const randomHour = 9 + Math.floor(Math.random() * 5); // 9-13
  const randomMinute = Math.floor(Math.random() * 60);
  const randomSecond = Math.floor(Math.random() * 60);

  scheduleDate.setHours(randomHour, randomMinute, randomSecond, 0);

  // Convert back to UTC ISO string for Resend
  // ET is UTC-5 (EST) or UTC-4 (EDT)
  const etOffset = new Date().toLocaleString("en-US", { timeZone: "America/New_York", timeZoneName: "short" });
  const isDST = etOffset.includes("EDT");
  const utcHours = randomHour + (isDST ? 4 : 5);

  const utcDate = new Date(scheduleDate);
  utcDate.setHours(utcHours, randomMinute, randomSecond, 0);

  return utcDate.toISOString();
}

async function sendEmail(to: string, subject: string, html: string, scheduledAt?: string): Promise<string | null> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return null;
  }

  const payload: Record<string, unknown> = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
    reply_to: "jose@mail.ninthstreetdigital.com",
  };

  if (scheduledAt) {
    payload.scheduled_at = scheduledAt;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Resend error for ${to}: ${err}`);
    return null;
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1] || "5") : 5;
  const dryRun = args.includes("--dry-run");

  const db = new Database(DB_PATH);

  const leads = db.query<Lead, [number]>(`
    SELECT p.id, p.display_name, p.primary_type, p.city, p.region, p.website_uri, p.phone,
           a.emails, a.free_subdomain, a.https, a.has_viewport, a.load_time_ms, a.copyright_year, a.generator,
           d.vercel_url AS draft_url
    FROM places p
    JOIN site_audits a ON a.place_id = p.id
    JOIN drafts d ON d.place_id = p.id AND d.status = 'deployed' AND d.vercel_url != 'failed'
    WHERE a.success = 1
      AND a.emails IS NOT NULL AND a.emails != '[]'
      AND p.website_uri IS NOT NULL
      AND p.id NOT IN (SELECT place_id FROM outreach)
    ORDER BY d.created_at DESC
    LIMIT ?
  `).all(limit);

  console.log(`Found ${leads.length} leads to contact`);

  const insertOutreach = db.prepare(`
    INSERT INTO outreach (place_id, type, to_email, subject, template, draft_url, status, resend_id)
    VALUES (?, 'email', ?, ?, 'cold-intro', ?, ?, ?)
  `);

  let sent = 0;
  for (const lead of leads) {
    const email = getLeadEmail(lead.emails);
    if (!email) {
      console.log(`  Skip ${lead.display_name} — no valid email`);
      continue;
    }

    const { subject, html } = renderTemplate(lead);

    if (dryRun) {
      console.log(`  [DRY RUN] Would send to ${email} — ${subject}`);
      continue;
    }

    const scheduledAt = getScheduledTime();
    const scheduleDisplay = new Date(scheduledAt).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "short", timeStyle: "short" });

    console.log(`  Scheduling to ${email} (${lead.display_name}) for ${scheduleDisplay} ET...`);
    const resendId = await sendEmail(email, subject, html, scheduledAt);

    if (resendId) {
      insertOutreach.run(lead.id, email, subject, lead.draft_url, "sent", resendId);
      sent++;
      console.log(`    ✓ Scheduled (${resendId}) → ${scheduleDisplay} ET`);
    } else {
      insertOutreach.run(lead.id, email, subject, lead.draft_url, "failed", null);
      console.log(`    ✗ Failed`);
    }

    // Rate limit: 1 email per second (just API calls, not actual sends)
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nDone: ${sent}/${leads.length} emails sent`);
  db.close();
}

main().catch(console.error);
