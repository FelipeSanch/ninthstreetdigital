import { cp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { $ } from "bun";
import { railway } from "@/lib/clients";
import {
  AgentLogger,
  ensureAgentDir,
  getPluginsForSDK,
  getTemplatePath,
  getWorkspacePath,
} from "@/lib/utils";
import type { AgentResult, WebDevContext } from "@/types";
import { WEBDEV_SYSTEM_PROMPT } from "./prompt";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable required`);
  }
  return value;
}

const AGENT_TYPE = "web-dev";

async function copyTemplates(
  sitePath: string,
  serviceName: string,
): Promise<void> {
  const templatePath = getTemplatePath(AGENT_TYPE);

  // Copy server.ts as-is
  await cp(join(templatePath, "server.ts"), join(sitePath, "server.ts"));

  // Copy package.json with service name substitution
  const pkgTemplate = await readFile(
    join(templatePath, "package.json"),
    "utf-8",
  );
  const pkgContent = pkgTemplate.replace("{{SERVICE_NAME}}", serviceName);
  await writeFile(join(sitePath, "package.json"), pkgContent);
}

async function deploy(
  serviceName: string,
  batchId: string,
  agentId: string,
  logger: AgentLogger,
): Promise<string> {
  const projectId = getRequiredEnv("RAILWAY_PROJECT_ID");
  const environmentId = getRequiredEnv("RAILWAY_ENVIRONMENT_ID");
  const githubRepo = getRequiredEnv("GITHUB_REPO"); // e.g., username/webdev-sites

  const workspacePath = getWorkspacePath(AGENT_TYPE);
  const rootDirectory = `batches/${batchId}/${agentId}/site`;

  await logger.log(`Deploying service: ${serviceName}`);

  // Commit and push to GitHub
  await logger.log("Pushing to GitHub");
  await $`git -C ${workspacePath} add -A`.quiet();
  await $`git -C ${workspacePath} commit -m ${`Add ${serviceName}`}`.quiet();
  await $`git -C ${workspacePath} push`.quiet();

  // Create service with repo via API
  const serviceId = await railway.createService(
    projectId,
    serviceName,
    githubRepo,
  );
  await logger.log(`Service created: ${serviceId}`);

  // Configure rootDirectory and trigger deploy
  await railway.configureService(environmentId, serviceId, rootDirectory);
  await logger.log(`Configured rootDirectory: ${rootDirectory}`);

  // Create domain via API
  const url = await railway.createDomain(serviceId, environmentId);
  await logger.log(`Domain created: ${url}`);

  return url;
}

export async function run(context: WebDevContext): Promise<AgentResult> {
  const { business, companySlug, batchId, agentId } = context;

  const sitePath = await ensureAgentDir(AGENT_TYPE, batchId, agentId);
  const logger = new AgentLogger(AGENT_TYPE, batchId, agentId);
  await logger.init();

  const serviceName = `${companySlug}-${agentId}`;
  await copyTemplates(sitePath, serviceName);

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

    // Phase 2: Runner deploys the site
    const deployedUrl = await deploy(serviceName, batchId, agentId, logger);

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
