import { appendFile, writeFile } from "node:fs/promises";
import { getLogPath } from "./workspace";

export class AgentLogger {
  private logPath: string;

  constructor(agentType: string, batchId: string, agentId: string) {
    this.logPath = getLogPath(agentType, batchId, agentId);
  }

  private timestamp(): string {
    return new Date().toISOString();
  }

  async init(): Promise<void> {
    await writeFile(this.logPath, `# Agent started at ${this.timestamp()}\n\n`);
  }

  async log(message: string): Promise<void> {
    const line = `${this.timestamp()} | ${message}\n`;
    await appendFile(this.logPath, line);
    console.log(message);
  }

  async tool(name: string, input?: unknown): Promise<void> {
    const inputStr = input ? ` ${JSON.stringify(input)}` : "";
    await this.log(`[Tool: ${name}]${inputStr}`);
  }

  async text(content: string): Promise<void> {
    await appendFile(this.logPath, `${content}\n`);
    console.log(content);
  }

  async error(message: string): Promise<void> {
    await this.log(`ERROR: ${message}`);
  }

  async result(cost: number): Promise<void> {
    await this.log(`Cost: $${cost.toFixed(4)}`);
  }
}
