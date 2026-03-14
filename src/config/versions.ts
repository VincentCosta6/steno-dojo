/**
 * Minimum plugin version this app is compatible with.
 * Bump this when making breaking changes to the WebSocket protocol.
 * Users on older versions will see a blocking update prompt.
 */
export const MIN_PLUGIN_VERSION = "0.2.0";

/**
 * GitHub releases API endpoint for the plover-steno-dojo plugin.
 * Used to check whether a newer version is available.
 */
export const PLUGIN_RELEASES_API =
  "https://api.github.com/repos/VincentCosta6/plover-steno-dojo/releases/latest";

/**
 * GitHub releases page shown to users who need to update.
 */
export const PLUGIN_RELEASES_URL =
  "https://github.com/VincentCosta6/plover-steno-dojo/releases/latest";
