/**
 * Progress tracking for resumable population runs
 */

const PROGRESS_FILE = "./data/.populate-progress.json";

interface Progress {
  offset: number;
  timestamp: string;
  config?: string; // hash of config to detect changes
}

export async function loadProgress(): Promise<number> {
  try {
    const data: Progress = await Bun.file(PROGRESS_FILE).json();
    return data.offset;
  } catch {
    return 0;
  }
}

export async function saveProgress(offset: number): Promise<void> {
  const data: Progress = { offset, timestamp: new Date().toISOString() };
  await Bun.write(PROGRESS_FILE, JSON.stringify(data));
}

export async function clearProgress(): Promise<void> {
  try {
    const exists = await Bun.file(PROGRESS_FILE).exists();
    if (exists) {
      await Bun.write(PROGRESS_FILE, "");
    }
  } catch {
    // ignore
  }
}
