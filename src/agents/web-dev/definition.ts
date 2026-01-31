import type { AgentDefinition } from "@/types";
import { WEBDEV_SYSTEM_PROMPT } from "./prompt";

export const webDevDefinition: AgentDefinition = {
  description:
    "Creates and deploys landing pages for businesses. Use for generating professional websites with photos, deploying to Railway.",
  prompt: WEBDEV_SYSTEM_PROMPT,
  tools: ["Write", "Read", "Bash", "Skill", "Glob", "Grep"],
};
