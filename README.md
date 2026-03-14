# Steno Dojo

A desktop app for learning and practicing stenography, built with [Tauri 2](https://v2.tauri.app/) + React + TypeScript.

Connect a steno machine (or Plover on your keyboard) and drill words, test your speed, and get real-time hint overlays showing the correct chord for each stroke.

---

## Features

- **Practice mode** — drill word lists with configurable word count and difficulty
- **Test mode** — timed speed tests with WPM and accuracy scoring
- **Real-time stroke display** — see exactly which keys you're pressing on an interactive steno keyboard diagram
- **Hint system** — shows the correct chord(s) for each word pulled from your Plover dictionary
- **Custom keyboards** — drop a JSON file into `src/keyboards/` to add any steno layout
- **Built-in layouts** — Ecosteno (compact) and Gemini PR (classic)
- **Plover integration** — connects to Plover via WebSocket; installer helper included

---

## Download

Pre-built installers for macOS, Windows, and Linux are available on the [Releases](../../releases) page.

| Platform | Format |
|----------|--------|
| macOS | `.dmg` |
| Windows | `.exe` (NSIS installer) |
| Linux | `.deb` / `.AppImage` |

---

## Requirements

### Running the app

- [Plover](https://www.openstenoproject.org/plover/) with the **plover-websocket-server** plugin installed (the app can install this for you)
- A steno machine, or Plover running in keyboard emulation mode

### Building from source

- [Rust](https://rustup.rs/) (stable, 1.77+)
- [Node.js](https://nodejs.org/) 20+
- npm
- System dependencies for Tauri: see the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/)

---

## Development

```bash
# Clone the repo
git clone <repo-url>
cd magma

# Install JS dependencies
npm install

# Start the app in dev mode (Tauri + Vite hot-reload)
npm run dev

# Frontend only (no Rust build, useful for UI work)
npm run vite:dev
```

### Build a production bundle

```bash
npm run build
```

Outputs platform-native installers to `src-tauri/target/release/bundle/`.

---

## Plover Setup

1. Install [Plover](https://www.openstenoproject.org/plover/)
2. Install the `plover-websocket-server` plugin — Steno Dojo has a built-in installer, or run:
   ```
   plover -s plover_plugins install plover-websocket-server
   ```
3. Restart Plover; the WebSocket server starts automatically on `ws://localhost:8086/`
4. Open Steno Dojo — it will connect automatically

---

## Custom Keyboards

Keyboard layouts are JSON files in `src/keyboards/`. See [KEYBOARDS.md](KEYBOARDS.md) for the full schema.

**Quick start:**

```json
{
  "id": "my-keyboard",
  "name": "My Steno Board",
  "manufacturer": "Acme",
  "cols": 14,
  "rows": 4,
  "keys": [
    { "id": "S-", "label": "S", "row": 1, "col": 0 }
  ]
}
```

Import your file in `src/keyboards/index.ts` and it will appear in the keyboard selector.

---

## Project Structure

```
src/
  components/       React UI components
  hooks/            usePlover, useSteno, etc.
  keyboards/        JSON keyboard definitions
  store/            Zustand state
  types/            TypeScript types
src-tauri/
  src/              Rust command handlers
  tauri.conf.json   Tauri configuration
plover-plugin/      WebSocket server Plover plugin (bundled with the app)
```

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

- Keep keyboard definitions in the `src/keyboards/` JSON format
- Rust code lives in `src-tauri/src/lib.rs`
- The app targets Tauri 2 — avoid Tauri 1 APIs

---

## License

MIT
