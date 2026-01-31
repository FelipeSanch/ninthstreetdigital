import { z } from "zod";

// Business input schema
export const BusinessInputSchema = z.object({
  name: z.string().min(1, "Business name required"),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters"),
  location: z.object({
    city: z.string(),
    state: z.string().optional(),
    country: z.string().optional(),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  services: z.array(z.string()).optional(),
  existingWebsiteUrl: z.string().url().optional(),
});

export type BusinessInput = z.infer<typeof BusinessInputSchema>;

// Agent result
export interface AgentResult {
  success: boolean;
  url?: string;
  business: string;
  batchId: string;
  agentId: string;
  error?: string;
}

// Web-dev specific types
export interface WebDevSetupResult {
  companySlug: string;
}

export interface WebDevContext {
  business: BusinessInput;
  companySlug: string;
  batchId: string;
  agentId: string;
}

// Agent definition (for subagent use)
export interface AgentDefinition {
  description: string;
  prompt: string;
  tools?: string[];
  model?: "sonnet" | "opus" | "haiku";
}

// Orchestrator types
export interface Agent<C, R> {
  run: (context: C) => Promise<R>;
}

export interface OrchestratorOptions<C> {
  agent: Agent<C, AgentResult>;
  count: number;
  context: Omit<C, "batchId" | "agentId">;
}
