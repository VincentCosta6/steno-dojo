import { useState, useEffect } from "react";
import { MIN_PLUGIN_VERSION, PLUGIN_RELEASES_API } from "../config/versions";

export type PluginVersionStatus =
  | "not_connected"   // WebSocket not connected — no check needed
  | "checking"        // Connected, waiting for hello (≤3s grace period)
  | "legacy"          // Connected 3s+, no hello — plugin predates version reporting
  | "too_old"         // hello received, version < MIN_PLUGIN_VERSION (blocking)
  | "update_available" // hello received, version < latest (informational)
  | "ok";             // hello received, version ≥ latest (or no releases found)

/** Compare two "x.y.z" version strings. Returns <0, 0, or >0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export interface PluginVersionCheckResult {
  status: PluginVersionStatus;
  /** Installed version string, or null if unknown */
  installedVersion: string | null;
  /** Latest version from GitHub, or null if not fetched yet */
  latestVersion: string | null;
}

export function usePluginVersionCheck(
  pluginVersion: string | null,
  isConnected: boolean,
): PluginVersionCheckResult {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [helloTimedOut, setHelloTimedOut] = useState(false);

  // Reset timeout flag when disconnected or when hello arrives
  useEffect(() => {
    if (!isConnected || pluginVersion !== null) {
      setHelloTimedOut(false);
      return;
    }
    // Give the plugin 3 seconds to send the hello message after connect
    const timer = setTimeout(() => setHelloTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [isConnected, pluginVersion]);

  // Fetch the latest release from GitHub once when connected
  useEffect(() => {
    if (!isConnected) return;
    let cancelled = false;
    fetch(PLUGIN_RELEASES_API)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        if (
          data &&
          typeof data === "object" &&
          "tag_name" in data &&
          typeof (data as Record<string, unknown>).tag_name === "string"
        ) {
          const tag = (data as { tag_name: string }).tag_name;
          setLatestVersion(tag.replace(/^v/, ""));
        }
      })
      .catch(() => {
        // GitHub unreachable — silently skip the update check
      });
    return () => { cancelled = true; };
  }, [isConnected]);

  const status: PluginVersionStatus = (() => {
    if (!isConnected) return "not_connected";
    if (pluginVersion === null) {
      return helloTimedOut ? "legacy" : "checking";
    }
    if (compareVersions(pluginVersion, MIN_PLUGIN_VERSION) < 0) return "too_old";
    if (latestVersion && compareVersions(pluginVersion, latestVersion) < 0) {
      return "update_available";
    }
    return "ok";
  })();

  return { status, installedVersion: pluginVersion, latestVersion };
}
