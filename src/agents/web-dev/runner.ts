import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import Database from "bun:sqlite";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { vercel } from "@/lib/clients";
import type { SiteFile } from "@/lib/clients/vercel";
import {
  AgentLogger,
  ensureAgentDir,
  getPluginsForSDK,
} from "@/lib/utils";
import type { AgentResult, WebDevContext } from "@/types";
import { WEBDEV_SYSTEM_PROMPT } from "./prompt";

interface ReferenceSite {
  business_name: string;
  city: string;
  rating: number;
  review_count: number;
  website_url: string;
  design_notes: string;
}

function getReferenceSites(category: string): ReferenceSite[] {
  try {
    const db = new Database("leads.db", { readonly: true });
    const sites = db.query<ReferenceSite, [string]>(`
      SELECT business_name, city, rating, review_count, website_url, design_notes
      FROM reference_sites 
      WHERE category = ?
      ORDER BY rating * log(review_count + 1) DESC
      LIMIT 3
    `).all(category);
    db.close();
    return sites;
  } catch {
    return [];
  }
}

function formatReferenceContext(sites: ReferenceSite[], category: string): string {
  if (sites.length === 0) return "";
  
  const formatted = sites.map((site, i) => 
    `${i + 1}. **${site.business_name}** (${site.city}) — ${site.rating}★, ${site.review_count} reviews
   URL: ${site.website_url}
   ${site.design_notes || ""}`
  ).join("\n\n");
  
  return `
## Reference: Top-Rated ${category.replace(/_/g, " ")} Websites

Before building, visit these exemplary websites from top-rated businesses in this category. Study what makes them effective:

${formatted}

Use Playwright to browse these sites. Note their:
- Hero section design and messaging
- Color schemes and typography
- How they present services
- Call-to-action placement
- Trust signals (reviews, certifications, years in business)

Build something at least as good, tailored to our client's brand.

---

`;

const AGENT_TYPE = "web-dev";

async function collectSiteFiles(sitePath: string): Promise<SiteFile[]> {
  const entries = await readdir(sitePath, { recursive: true });
  const files: SiteFile[] = [];

  for (const entry of entries) {
    const fullPath = join(sitePath, entry);
    const stat = await Bun.file(fullPath).exists();
    if (!stat) continue;

    const file = Bun.file(fullPath);
    if ((await file.size) === 0) continue;

    // Skip directories by checking if it's a file
    try {
      const content = await readFile(fullPath, "utf-8");
      files.push({ file: entry, data: content, encoding: "utf-8" });
    } catch {
      // Binary file — base64 encode
      const buffer = await readFile(fullPath);
      files.push({
        file: entry,
        data: buffer.toString("base64"),
        encoding: "base64",
      });
    }
  }

  return files;
}

async function deploy(
  serviceName: string,
  sitePath: string,
  logger: AgentLogger,
): Promise<string> {
  const vercelDomain = process.env.VERCEL_DOMAIN;

  await logger.log(`Deploying service: ${serviceName}`);

  // Collect all site files
  const files = await collectSiteFiles(sitePath);
  await logger.log(`Collected ${files.length} files for deployment`);

  // Deploy to Vercel (auto-creates project)
  let url = await vercel.deploy(serviceName, files);
  await logger.log(`Deployed: ${url}`);

  // Add custom subdomain if domain is configured
  if (vercelDomain) {
    const subdomain = serviceName;
    const customDomain = `${subdomain}.${vercelDomain}`;
    const domainResult = await vercel.addDomain(serviceName, customDomain);
    await logger.log(
      `Domain added: ${customDomain} (verified: ${domainResult.verified})`,
    );

    // Create DNS CNAME record (domain NS delegated to Vercel)
    try {
      const dnsUid = await vercel.createDnsRecord(vercelDomain, subdomain);
      await logger.log(`DNS CNAME created: ${subdomain} -> cname.vercel-dns.com (${dnsUid})`);
    } catch (e: any) {
      // Record may already exist — not fatal
      await logger.log(`DNS record note: ${e.message}`);
    }

    url = `https://${customDomain}`;
  }

  return url;
}

export async function run(context: WebDevContext): Promise<AgentResult> {
  const { business, companySlug, batchId, agentId } = context;

  const sitePath = await ensureAgentDir(AGENT_TYPE, batchId, agentId);
  const logger = new AgentLogger(AGENT_TYPE, batchId, agentId);
  await logger.init();

  const serviceName = companySlug;

  await logger.log(`Starting web-dev agent for: ${business.name}`);
  await logger.log(`Batch: ${batchId} | Agent: ${agentId}`);
  await logger.log(`Service: ${serviceName}`);
  await logger.log(`Site path: ${sitePath}`);

  let correctedEmail: string | undefined;
  const plugins = getPluginsForSDK(["frontend-design", "photo-mcp"]);

  const businessContext = `
Business Details:
- Name: ${business.name}
- Description: ${business.description}
- Location: ${business.location.city}${business.location.state ? `, ${business.location.state}` : ""}${business.location.country ? `, ${business.location.country}` : ""}
- Email: ${business.contact.email}
- Phone: ${business.contact.phone || "Not provided"}
- Address: ${business.contact.address || "Not provided"}
- Services: ${business.services?.join(", ") || "General services"}
${business.existingWebsiteUrl ? `- Current Website: ${business.existingWebsiteUrl}` : ""}

Working Directory: ${sitePath}
`;

  // Fetch reference sites for this business category
  const category = business.category || business.primaryType || "";
  const referenceSites = getReferenceSites(category);
  const referenceContext = formatReferenceContext(referenceSites, category);
  
  if (referenceSites.length > 0) {
    await logger.log(`Found ${referenceSites.length} reference sites for category: ${category}`);
  }

  const researchStep = business.existingWebsiteUrl
    ? `FIRST: Visit their current website at ${business.existingWebsiteUrl} using your web fetch tool. Study it to learn:
- What services they actually offer (use their real services, not generic ones)
- Their brand voice and tone
- Any specific details: years in business, team info, specialties, service areas
- What's wrong with it (outdated design, missing sections, poor mobile experience)

Use what you learn to build something WAY better. Match their real services and info, but with modern design.

THEN: Create the website using the info below plus what you learned:\n\n`
    : "";

  const prompt = `${referenceContext}${researchStep}Create a website for this business:

${businessContext}`;

  try {
    // Phase 1: Agent builds the site
    const queryResult = query({
      prompt,
      options: {
        model: "sonnet",
        cwd: sitePath,
        systemPrompt: WEBDEV_SYSTEM_PROMPT,
        plugins,
        permissionMode: "bypassPermissions",
        settingSources: ["project"],
        outputFormat: {
          type: "json_schema" as const,
          schema: {
            type: "object",
            properties: {
              correctedEmail: {
                type: "string",
                description: "Better contact email found on their website, if different from what was provided. Only set if you found a more relevant email (business owner, main contact) vs a web dev agency or generic email.",
              },
            },
          },
        },
      },
    });

    for await (const message of queryResult) {
      if (message.type === "assistant") {
        const assistantMsg = message as {
          message: { content: Array<{ type: string; text?: string }> };
        };
        for (const block of assistantMsg.message.content) {
          if (block.type === "text" && block.text) {
            await logger.text(block.text);
          } else if (block.type === "tool_use") {
            const toolBlock = block as { name?: string; input?: unknown };
            await logger.tool(toolBlock.name || "unknown", toolBlock.input);
          }
        }
      }

      if (message.type === "result") {
        const resultMsg = message as {
          subtype: string;
          result: string;
          total_cost_usd: number;
          structured_output?: { correctedEmail?: string };
        };

        await logger.result(resultMsg.total_cost_usd);

        if (resultMsg.structured_output?.correctedEmail) {
          correctedEmail = resultMsg.structured_output.correctedEmail;
          await logger.log(`Agent found better email: ${correctedEmail}`);
        }

        if (resultMsg.subtype !== "success") {
          await logger.error(`Agent failed: ${resultMsg.subtype}`);
          return {
            success: false,
            business: business.name,
            batchId,
            agentId,
            error: `Agent failed with status: ${resultMsg.subtype}`,
          };
        }
      }
    }

    // Phase 2: Deploy to Vercel
    const deployedUrl = await deploy(serviceName, sitePath, logger);

    return {
      success: true,
      url: deployedUrl,
      business: business.name,
      batchId,
      agentId,
      correctedEmail,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error(errorMessage);
    return {
      success: false,
      business: business.name,
      batchId,
      agentId,
      error: errorMessage,
    };
  }
}
