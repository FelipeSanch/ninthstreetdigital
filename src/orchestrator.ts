import { generateAgentId, generateBatchId } from "@/lib/utils";
import type { AgentResult, OrchestratorOptions } from "@/types";

function generateUniqueAgentIds(count: number): string[] {
  const ids = new Set<string>();
  while (ids.size < count) {
    ids.add(generateAgentId());
  }
  return [...ids];
}

export async function orchestrate<
  C extends { batchId: string; agentId: string },
>({ agent, count, context }: OrchestratorOptions<C>): Promise<AgentResult[]> {
  const batchId = generateBatchId();
  const agentIds = generateUniqueAgentIds(count);

  console.log(`Batch ${batchId}: spawning ${count} agents`);

  const tasks = agentIds.map((agentId) =>
    agent.run({ ...context, batchId, agentId } as C),
  );

  return Promise.all(tasks);
}
