# AmnesiaLight — assets

Product assets for the AmnesiaLight privacy browser. These are the primary,
editable vector sources for the identity; exported raster icons live in
[`../icons/`](../icons/) and are generated with [`../tools/make-icons.ps1`](../tools/make-icons.ps1).

## Files

| File | Description |
| --- | --- |
| `logo-mark.svg` | The lotus/flower mark only. Radial lotus with eight outer petals plus eight inner accent petals, white background, glowing center. Use for avatars, favicons, loading screens. |
| `logo-full.svg` | The mark with the **AmnesiaLight** wordmark underneath. Use for headers, splash screens, README banners. |

The SVGs are hand-authored, resolution-independent, and use only the palette
below. The mark reads left-to-right as a green → teal → cyan gradient, echoing
the "green & blue" identity.

## Palette

| Colour | Hex | Role |
| --- | --- | --- |
| Green | `#23a06a` | Primary brand green (left half of the mark) |
| Teal | `#14b8a6` | Mid gradient / "Light" wordmark |
| Cyan | `#38bdf8` | Accent blue (right half of the mark) |
| Deep green | `#0c2a1f` | Dark ink / "Amnesia" wordmark, darkest gradient stop |
| Ink (dark) | `#123a2b` | Inner-petal shadow tone |
| Light | `#e8fbf4` | Center glow tint |
| White | `#ffffff` | Background / petal separators |

## Editing guidelines

- Keep the geometry geometric and tidy: petals are rotated copies around the
  logical center `(128,128)` in a `256 × 256` viewBox.
- Prefer the palette above. Do not introduce off-brand colours.
- Keep files self-contained (no external references, fonts, or scripts).
- Do not add third-party brand names to file contents or file names.
- After changing a shape, regenerate the raster icons with
  `powershell -File tools\make-icons.ps1` so `icons/` stays in sync.

## Rendering

Any modern browser, Inkscape, or `rsvg-convert` renders these files. A quick
sanity render:

```powershell
# Windows: convert the full logo to PNG at 1024px wide (requires Inkscape)
inkscape --export-type=png --export-width=1024 "D:\AmnesiaLight\assets\logo-full.svg"
```

```bash
# Linux: rasterize with librsvg
rsvg-convert -w 1024 assets/logo-full.svg -o logo-full.png
```
