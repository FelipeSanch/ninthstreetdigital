import { existsSync } from "node:fs";
import { join } from "node:path";

function getLocalPluginPath(pluginName: string): string {
  return join(process.cwd(), "plugins", pluginName);
}

export function getPluginsForSDK(
  pluginNames: string[],
): Array<{ type: "local"; path: string }> {
  const plugins: Array<{ type: "local"; path: string }> = [];

  for (const name of pluginNames) {
    const path = getLocalPluginPath(name);
    if (!existsSync(path)) {
      throw new Error(
        `Plugin "${name}" not found at ${path}. Run: /plugin install ${name} --scope project`,
      );
    }
    plugins.push({ type: "local", path });
  }

  return plugins;
}
