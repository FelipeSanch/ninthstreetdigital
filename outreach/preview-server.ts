import { readFileSync } from "node:fs";
import { join } from "node:path";

const TEMPLATE_DIR = join(import.meta.dir, "templates");

// Sample data for preview
const sampleData = {
  OWNER_NAME: "Sarah",
  BUSINESS_NAME: "Golden Crust Bakery",
  DRAFT_URL: "https://bakery.ninthstreetdigital.com",
  AUDIT_NOTES: "Your current site loads in about 3 seconds (customers expect under 1.5s), it's built on an older Wix template, and it's missing some SEO basics that would help you show up in local searches. Small fixes that make a big difference.",
};

function renderTemplate(name: string, data: Record<string, string>): string {
  let html = readFileSync(join(TEMPLATE_DIR, `${name}.html`), "utf-8");
  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}

Bun.serve({
  hostname: "0.0.0.0",
  port: 3456,
  routes: {
    "/": new Response(renderTemplate("cold-intro", sampleData), {
      headers: { "Content-Type": "text/html" },
    }),
  },
});

console.log("Email preview → http://localhost:3456");
