import { useState, useEffect, useRef, useCallback } from "react";
import type { PloverStatus, PloverMessage } from "../types";
import { parseStroke } from "./useSteno";

export interface PloverState {
  status: PloverStatus;
  /** Active steno keys from the most recent stroke */
  activeKeys: string[];
  /** The raw RTF/CRE of the last stroke */
  lastStroke: string;
  /** The translated text from the last stroke */
  lastTranslation: string;
  /** Machine name reported by Plover (e.g. "Gemini PR", "Keyboard") */
  machineName: string;
  /** Whether the physical steno machine is connected within Plover */
  machineConnected: boolean;
  /** Total strokes received since connected */
  strokeCount: number;
  /** Plugin version from the "hello" handshake, or null if not yet received */
  pluginVersion: string | null;
}

export interface UsePloverReturn extends PloverState {
  connect: (url: string) => void;
  disconnect: () => void;
}

/**
 * Normalize the translation text from various Plover message formats.
 * Handles raw words, meta strokes like {.}, {,}, {^}, etc.
 */
function normalizeTranslation(raw: string): string {
  if (!raw) return "";
  // Strip leading/trailing whitespace that Plover prepends
  let t = raw.trim();
  // Remove glue/attach markers like {^}, {^word^}, {word^}
  t = t.replace(/\{[^}]*\}/g, "").trim();
  return t;
}

/**
 * Extract stroke string from various Plover WebSocket message formats.
 * Different plugins send the stroke in different fields.
 */
function extractStroke(msg: PloverMessage): string | null {
  // Format 1: {"type": "stroked", "stroke": "TEFT"}
  if (typeof msg.stroke === "string") return msg.stroke;
  // Format 2: {"type": "stroke", "steno": "TEFT"}
  if (typeof msg.steno === "string") return msg.steno;
  // Format 3: stroke as an object with rtfcre property
  if (typeof msg.stroke === "object" && msg.stroke !== null) {
    const s = msg.stroke as Record<string, unknown>;
    if (typeof s.rtfcre === "string") return s.rtfcre;
  }
  return null;
}

/**
 * Extract translation text from a Plover WebSocket message.
 */
function extractTranslation(msg: PloverMessage): string | null {
  if (typeof msg.translation === "string")
    return normalizeTranslation(msg.translation);
  if (typeof msg.text === "string") return normalizeTranslation(msg.text);
  // Some plugins nest translation in an "action" object
  if (typeof msg.text === "string") return normalizeTranslation(msg.text);
  return null;
}

export function usePlover(initialUrl?: string): UsePloverReturn {
  const [state, setState] = useState<PloverState>({
    status: "disconnected",
    activeKeys: [],
    lastStroke: "",
    lastTranslation: "",
    machineName: "",
    machineConnected: false,
    strokeCount: 0,
    pluginVersion: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlRef = useRef<string>(initialUrl ?? "ws://localhost:8086/");

  const clearReconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  const connect = useCallback((url: string) => {
    clearReconnect();
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    urlRef.current = url;

    setState((prev) => ({ ...prev, status: "connecting" }));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setState((prev) => ({ ...prev, status: "connected", pluginVersion: null }));
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg: PloverMessage = JSON.parse(event.data as string);

          if (msg.type === "hello" && typeof msg.version === "string") {
            setState((prev) => ({ ...prev, pluginVersion: msg.version! }));
          } else if (
            msg.type === "stroked" ||
            msg.type === "stroke" ||
            msg.type === "translated"
          ) {
            const strokeStr = extractStroke(msg);
            if (strokeStr) {
              const keys = parseStroke(strokeStr);
              const translation = extractTranslation(msg) ?? "";
              setState((prev) => ({
                ...prev,
                activeKeys: keys,
                lastStroke: strokeStr,
                lastTranslation: translation,
                strokeCount: prev.strokeCount + 1,
              }));
            }
          } else if (msg.type === "machine_state_changed") {
            // plover-steno-dojo uses machine_type; older builds used machine
            const name = msg.machine_type ?? msg.machine ?? "";
            const connected = msg.state === "connected";
            setState((prev) => ({
              ...prev,
              machineName: name || prev.machineName,
              machineConnected: connected,
            }));
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        setState((prev) => ({ ...prev, status: "error" }));
      };

      ws.onclose = () => {
        setState((prev) => ({
          ...prev,
          status: "disconnected",
          activeKeys: [],
          machineConnected: false,
        }));
        // Auto-reconnect after 3 seconds
        reconnectTimer.current = setTimeout(() => {
          if (urlRef.current) connect(urlRef.current);
        }, 3000);
      };
    } catch {
      setState((prev) => ({ ...prev, status: "error" }));
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnect();
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      status: "disconnected",
      activeKeys: [],
    }));
  }, []);

  // Auto-connect on mount if URL provided
  useEffect(() => {
    if (initialUrl) connect(initialUrl);
    return () => {
      clearReconnect();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, connect, disconnect };
}
