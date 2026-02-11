/**
 * Vercel SDK Client
 * Handles deployment, domain assignment, and DNS for static sites.
 */

import { Vercel } from "@vercel/sdk";

export interface SiteFile {
  file: string;
  data: string;
  encoding: "utf-8" | "base64";
}

function getClient(): Vercel {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN environment variable required");
  }
  return new Vercel({ bearerToken: token });
}

function getTeamId(): string | undefined {
  return process.env.VERCEL_TEAM_ID || undefined;
}

/**
 * Deploy static files to Vercel. Auto-creates project if it doesn't exist.
 * Returns the live deployment URL.
 */
export async function deploy(
  projectName: string,
  files: SiteFile[],
): Promise<string> {
  const client = getClient();

  const result = await client.deployments.createDeployment({
    teamId: getTeamId(),
    requestBody: {
      name: projectName,
      target: "production",
      projectSettings: {
        framework: null,
        buildCommand: "",
        outputDirectory: ".",
      },
      files: files.map((f) => ({
        file: f.file,
        data: f.data,
        encoding: f.encoding,
      })),
    },
  });

  return `https://${result.url}`;
}

/**
 * Add a custom domain to a Vercel project.
 * If nameservers are delegated to Vercel, verification is automatic.
 */
export async function addDomain(
  projectName: string,
  domain: string,
): Promise<{ verified: boolean }> {
  const client = getClient();

  const result = await client.projects.addProjectDomain({
    idOrName: projectName,
    teamId: getTeamId(),
    requestBody: {
      name: domain,
    },
  });

  return { verified: result.verified };
}

/**
 * Create a DNS record on a Vercel-managed domain.
 */
export async function createDnsRecord(
  domain: string,
  subdomain: string,
): Promise<string> {
  const client = getClient();

  const result = await client.dns.createRecord({
    domain,
    teamId: getTeamId(),
    requestBody: {
      type: "CNAME",
      name: subdomain,
      value: "cname.vercel-dns.com",
      ttl: 60,
    },
  });

  return result.uid;
}

/**
 * Get all webhooks for the account/team.
 */
export async function getWebhooks() {
  const client = getClient();
  return client.webhooks.getWebhooks({
    teamId: getTeamId(),
  });
}

/**
 * Create a webhook for deployment events.
 * Returns the webhook ID and secret for signature verification.
 */
export async function createWebhook(
  url: string,
  events: string[] = ["deployment.ready", "deployment.error"],
): Promise<{ id: string; secret: string }> {
  const client = getClient();

  const result = await client.webhooks.createWebhook({
    teamId: getTeamId(),
    requestBody: {
      url,
      events: events as any,
    },
  });

  return {
    id: result.id,
    secret: result.secret,
  };
}

/**
 * Delete a webhook by ID.
 */
export async function deleteWebhook(id: string): Promise<void> {
  const client = getClient();
  await client.webhooks.deleteWebhook({
    id,
    teamId: getTeamId(),
  });
}
