import { readFileSync } from "node:fs";
import { generateAgentId, generateBatchId } from "@/lib/utils";
import { type BusinessInput, BusinessInputSchema } from "@/types";
import * as webDev from "./agents/web-dev";
import { orchestrate } from "./orchestrator";

function printUsage() {
  console.log(`
WebDev Agent - Generate and deploy landing pages

Usage:
  bun run src/index.ts --input <file.json>              Single draft
  bun run src/index.ts --input <file.json> --drafts 3   Multiple drafts

Options:
  --input, -i     Load business from JSON file
  --business, -b  Pass business JSON directly
  --drafts, -d    Number of drafts to generate (default: 1)
  --help, -h      Show this help

Business JSON format:
{
  "name": "Business Name",
  "description": "What the business does",
  "location": { "city": "City", "state": "State" },
  "contact": { "email": "email@example.com", "phone": "123-456-7890" },
  "services": ["Service 1", "Service 2"]
}
`);
}

interface Args {
  input?: string;
  business?: string;
  drafts: number;
  help: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = { drafts: 1, help: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--input" || arg === "-i") {
      result.input = args[++i];
    } else if (arg === "--business" || arg === "-b") {
      result.business = args[++i];
    } else if (arg === "--drafts" || arg === "-d") {
      result.drafts = parseInt(args[++i] || "1", 10);
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  let business: BusinessInput;

  try {
    if (args.input) {
      const content = readFileSync(args.input, "utf8");
      business = BusinessInputSchema.parse(JSON.parse(content));
    } else if (args.business) {
      business = BusinessInputSchema.parse(JSON.parse(args.business));
    } else {
      console.error("Missing --input or --business argument");
      printUsage();
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Invalid business input: ${error.message}`);
    } else {
      console.error("Invalid business input");
    }
    printUsage();
    process.exit(1);
  }

  console.log(`\nBusiness: ${business.name}`);
  console.log(`  ${business.description}`);
  console.log(
    `  ${business.location.city}${business.location.state ? `, ${business.location.state}` : ""}`,
  );
  console.log(`  ${business.contact.email}`);
  console.log(`  Drafts: ${args.drafts}\n`);

  // Setup: get company slug
  const { companySlug } = await webDev.setup(business);
  console.log(`Company slug: ${companySlug}\n`);

  if (args.drafts > 1) {
    // Multiple drafts via orchestrator
    const results = await orchestrate({
      agent: webDev,
      count: args.drafts,
      context: { business, companySlug },
    });

    console.log("\n--- Results ---");
    for (const result of results) {
      console.log(
        `${result.agentId}: ${result.success ? result.url : result.error}`,
      );
    }

    console.log("\n--- JSON ---");
    console.log(JSON.stringify(results, null, 2));

    const allSuccess = results.every((r) => r.success);
    process.exit(allSuccess ? 0 : 1);
  } else {
    // Single draft
    const batchId = generateBatchId();
    const agentId = generateAgentId();
    const result = await webDev.run({
      business,
      companySlug,
      batchId,
      agentId,
    });

    console.log("\n--- Result ---");
    console.log(JSON.stringify(result, null, 2));

    process.exit(result.success ? 0 : 1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
