import { mkdir } from "node:fs/promises";
import { join } from "node:path";

export function getWorkspacePath(agentType: string): string {
  return join(process.cwd(), "workspaces", agentType);
}

export function getBatchPath(agentType: string, batchId: string): string {
  return join(getWorkspacePath(agentType), "batches", batchId);
}

export function getAgentPath(
  agentType: string,
  batchId: string,
  agentId: string,
): string {
  return join(getBatchPath(agentType, batchId), agentId);
}

export function getSitePath(
  agentType: string,
  batchId: string,
  agentId: string,
): string {
  return join(getAgentPath(agentType, batchId, agentId), "site");
}

export function getTemplatePath(agentType: string): string {
  return join(process.cwd(), "src", "agents", agentType, "templates");
}

export function getLogPath(
  agentType: string,
  batchId: string,
  agentId: string,
): string {
  return join(getAgentPath(agentType, batchId, agentId), "agent.log");
}

export async function ensureAgentDir(
  agentType: string,
  batchId: string,
  agentId: string,
): Promise<string> {
  const sitePath = getSitePath(agentType, batchId, agentId);
  await mkdir(sitePath, { recursive: true });
  return sitePath;
}
