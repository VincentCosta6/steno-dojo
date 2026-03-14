import type React from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PluginVersionCheckResult } from "../hooks/usePluginVersionCheck";
import { MIN_PLUGIN_VERSION, PLUGIN_RELEASES_URL } from "../config/versions";

interface Props extends PluginVersionCheckResult {
  /** Called when user dismisses the "update available" notice */
  onDismiss?: () => void;
}

export function PluginVersionBanner({ status, installedVersion, latestVersion, onDismiss }: Props) {
  if (status === "not_connected" || status === "checking" || status === "ok") {
    return null;
  }

  if (status === "legacy") {
    return (
      <Banner color="orange">
        <span>
          <strong>Plugin update required</strong> — your plover-steno-dojo plugin is too old to
          report its version. Please update to v{MIN_PLUGIN_VERSION}+.
        </span>
        <ReleasesLink />
      </Banner>
    );
  }

  if (status === "too_old") {
    return (
      <Banner color="red">
        <span>
          <strong>Incompatible plugin</strong> — installed v{installedVersion} but this app
          requires v{MIN_PLUGIN_VERSION}+. Some features may not work correctly.
        </span>
        <ReleasesLink />
      </Banner>
    );
  }

  if (status === "update_available") {
    return (
      <Banner color="yellow" onDismiss={onDismiss}>
        <span>
          Plugin update available: v{installedVersion} → v{latestVersion}.
        </span>
        <ReleasesLink label="Update now" />
      </Banner>
    );
  }

  return null;
}

function ReleasesLink({ label = "View releases" }: { label?: string }) {
  return (
    <button
      className="ml-2 underline font-semibold hover:opacity-80 transition-opacity"
      onClick={() =>
        invoke("plugin:opener|open_url", { url: PLUGIN_RELEASES_URL }).catch(() =>
          window.open(PLUGIN_RELEASES_URL, "_blank"),
        )
      }
    >
      {label} →
    </button>
  );
}

function Banner({
  color,
  children,
  onDismiss,
}: {
  color: "red" | "orange" | "yellow";
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const palette = {
    red:    { bg: "bg-red-950/80",    border: "border-red-700/60",    text: "text-red-200" },
    orange: { bg: "bg-orange-950/80", border: "border-orange-600/60", text: "text-orange-200" },
    yellow: { bg: "bg-yellow-950/80", border: "border-yellow-600/60", text: "text-yellow-200" },
  }[color];

  return (
    <div
      className={`flex items-center justify-between px-4 py-1.5 text-xs font-mono border-b ${palette.bg} ${palette.border} ${palette.text}`}
    >
      <div className="flex items-center gap-1">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 opacity-60 hover:opacity-100 transition-opacity text-base leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
