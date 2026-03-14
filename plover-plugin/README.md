# plover-steno-dojo

WebSocket server plugin for [Steno Dojo](https://github.com/stenodojo/steno-dojo).

Broadcasts real-time stroke and machine state events so the Steno Dojo app can
highlight keys and track your strokes. No external dependencies — uses only the
Python standard library.

## Install

### From the Steno Dojo app (recommended)

Use the **Settings → Install Plugin** button inside Steno Dojo.

### Manual install via terminal

Find Plover's bundled Python and run:

```bash
# macOS
/Applications/Plover.app/Contents/MacOS/Plover -m pip install /path/to/plover-plugin

# or, if you have a standalone Python Plover install
pip install /path/to/plover-plugin
```

Then restart Plover, open **Plug-ins Manager**, enable **steno_dojo**, and click **Apply**.

## Usage

Once enabled in Plover, the plugin listens on `ws://localhost:8086/`.

Start Steno Dojo and it will connect automatically.

## Message format

```json
{"type": "stroked",               "stroke": "TEFT"}
{"type": "machine_state_changed", "machine_type": "Gemini PR", "state": "connected"}
```
