import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * macOS-style traffic light window controls (close / minimise / maximise).
 * Uses the Tauri window API — requires core:window:allow-* permissions.
 */
export function WindowControls() {
  const win = getCurrentWindow();

  return (
    <div className="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => win.close()}
        className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 focus:outline-none cursor-default"
        title="Close"
        aria-label="Close window"
      />
      <button
        onClick={() => win.minimize()}
        className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-90 focus:outline-none cursor-default"
        title="Minimise"
        aria-label="Minimise window"
      />
      <button
        onClick={() => win.toggleMaximize()}
        className="w-3 h-3 rounded-full bg-[#28c940] hover:brightness-90 focus:outline-none cursor-default"
        title="Maximise"
        aria-label="Maximise window"
      />
    </div>
  );
}

/**
 * Call on onMouseDown of any element you want to act as a drag handle.
 * Only fires on left-button press; stops propagation so buttons inside
 * the titlebar don't accidentally start a drag.
 */
export function startDrag(e: React.MouseEvent) {
  if (e.button !== 0) return;
  getCurrentWindow().startDragging();
}
