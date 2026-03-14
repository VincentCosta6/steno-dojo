import { open } from "@tauri-apps/plugin-shell";

/**
 * Open a URL in the system's default browser via shell.open,
 * with a window.open fallback for browser dev mode.
 */
export async function openLink(url: string): Promise<void> {
  try {
    await open(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
