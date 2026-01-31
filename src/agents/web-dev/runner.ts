import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
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
  const url = await vercel.deploy(serviceName, files);
  await logger.log(`Deployed: ${url}`);

  // Add custom subdomain if domain is configured
  if (vercelDomain) {
    const subdomain = serviceName;
    const customDomain = `${subdomain}.${vercelDomain}`;
    const domainResult = await vercel.addDomain(serviceName, customDomain);
    await logger.log(
      `Domain added: ${customDomain} (verified: ${domainResult.verified})`,
    );
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

Working Directory: ${sitePath}
`;

  const prompt = `Create a landing page for this business:

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
        };

        await logger.result(resultMsg.total_cost_usd);

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
