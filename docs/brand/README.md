# VaultCV brand assets

| File | Use |
|------|-----|
| `vaultcv-mark.svg` | Logo mark, light backgrounds |
| `vaultcv-mark-dark.svg` | Logo mark, dark backgrounds |
| `vaultcv-mark-small.svg` | Simplified mark for 32 px and below (no hinges) |
| `vaultcv-vault-door.svg` | Detailed vault door illustration, dark (as on the brand sheet) |
| `vaultcv-vault-door-light.svg` | Detailed vault door illustration, light |
| `social-preview.png` | GitHub social preview, dark (1280×640) — set in repo **Settings → General → Social preview** |
| `social-preview-light.png` | Light variant, used by the main README in light mode |

## Palette

| Name | Hex | Role |
|------|-----|------|
| Vault Ink | `#0B1020` | Dark canvas, primary text |
| Key Indigo | `#4F46E5` | Accent, actions, mark (`--vc-accent`) |
| Indigo light | `#818CF8` | Accent on dark (`--vc-accent` in dark mode) |
| Unlock Mint | `#34D399` | "Access granted" moments only |
| Paper | `#F7F8FB` | Light canvas (`--vc-canvas`) |

## Type

Bricolage Grotesque (display, wordmark) · Geist (text) · Geist Mono (codes, links). All on Google Fonts.

## Regenerating the PNGs

The previews are rendered from the HTML in `source/` with headless Chrome:

```bash
chrome --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,640 --virtual-time-budget=8000 --screenshot=social-preview.png source/social-preview.html
```
