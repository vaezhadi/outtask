# Third-party assets & licenses

| Asset | Source | License | Use |
|---|---|---|---|
| Morabba font (`fonts/Morabba-*.ttf`) | Morabba typeface (free Persian font) | Free for use; see upstream license | UI font, canvas labels |
| Open Doodles (`doodles/*.svg`) | `react-open-doodles` package | **CC0** — free commercial use, no attribution required | Empty-state illustrations (vendored offline; do not hotlink) |
| Extension icons (`icons/`, `icons-pack/`) | Project's own | Project's own | App icons |
| Sounds (`sounds/*`) | Project's own | Project's own | Alarms/notifications |

No runtime npm dependencies ship with the extension. `tests/` uses jsdom (MIT) as
a dev-only dependency.

Code is proprietary (no license file = all rights reserved) unless the owner
adds one.
