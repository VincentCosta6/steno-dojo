# Adding Custom Keyboards

Steno Dojo supports any keyboard layout that uses standard steno keys.
To add your own keyboard, create a JSON file in `src/keyboards/` and import it
in `src/keyboards/index.ts`.

## JSON Schema

```json
{
  "id": "my-keyboard",
  "name": "My Keyboard",
  "manufacturer": "Acme Steno Co.",
  "description": "A brief description of the keyboard.",
  "url": "https://example.com",

  "gridCols": 14,
  "gridRows": 4,

  "keys": [
    {
      "id": "num",
      "stenoKey": "#",
      "label": "#",
      "col": 0,
      "row": 0,
      "colSpan": 14,
      "rowSpan": 1
    }
  ]
}
```

## Grid Layout

The keyboard is rendered as a CSS Grid. Coordinates are **0-indexed**:

```
Row 0 →  Number bar  (col 0 … gridCols-1)
Row 1 →  Upper main  (left hand upper + right hand upper)
Row 2 →  Lower main  (left hand lower + right hand lower)
Row 3 →  Thumb row   (A, O on left · E, U on right)
```

### Key positions for a standard 14-column layout

| col | row 0 | row 1 | row 2 | row 3 |
|-----|-------|-------|-------|-------|
| 0   | #     | S-    | S-    |       |
| 1   | #     | T-    | K-    |       |
| 2   | #     | P-    | W-    |       |
| 3   | #     | H-    | R-    |       |
| 4   | #     |       |       | A-    |
| 5   | #     |       |       | O-    |
| 6   | #     | *     | *     |       |
| 7   | #     |       |       | -E    |
| 8   | #     |       |       | -U    |
| 9   | #     | -F    | -R    |       |
| 10  | #     | -P    | -B    |       |
| 11  | #     | -L    | -G    |       |
| 12  | #     | -T    | -S    |       |
| 13  | #     | -D    | -Z    |       |

### Spanning rows

For keyboards like the Ecosteno that have a single tall S key:
```json
{ "id": "S", "stenoKey": "S-", "label": "S", "col": 0, "row": 1, "rowSpan": 2 }
```

For keyboards like the Gemini PR that have two separate S keys:
```json
{ "id": "SU", "stenoKey": "S-", "label": "S", "col": 0, "row": 1 },
{ "id": "SL", "stenoKey": "S-", "label": "S", "col": 0, "row": 2 }
```

Multiple keys can share the same `stenoKey` — they will all highlight together.

## Valid `stenoKey` Values

| Key Name | Position       |
|----------|----------------|
| `#`      | Number bar     |
| `S-`     | Left S         |
| `T-`     | Left T         |
| `K-`     | Left K         |
| `P-`     | Left P         |
| `W-`     | Left W         |
| `H-`     | Left H         |
| `R-`     | Left R         |
| `A-`     | Left vowel A   |
| `O-`     | Left vowel O   |
| `*`      | Asterisk       |
| `-E`     | Right vowel E  |
| `-U`     | Right vowel U  |
| `-F`     | Right F        |
| `-R`     | Right R        |
| `-P`     | Right P        |
| `-B`     | Right B        |
| `-L`     | Right L        |
| `-G`     | Right G        |
| `-T`     | Right T        |
| `-S`     | Right S        |
| `-D`     | Right D        |
| `-Z`     | Right Z        |

## Registering Your Keyboard

After creating your JSON file, add it to `src/keyboards/index.ts`:

```typescript
import myKeyboard from "./my-keyboard.json";

export const BUILT_IN_KEYBOARDS: KeyboardDefinition[] = [
  ecosteno as KeyboardDefinition,
  geminipr as KeyboardDefinition,
  myKeyboard as KeyboardDefinition,  // ← add here
];
```

Your keyboard will then appear in Settings → Keyboard Layout.
