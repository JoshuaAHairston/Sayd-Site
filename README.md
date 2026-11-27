# Photo Timeline

Browse photos by year → month → day. Front-end only: React 19, React Router, Tailwind v4, `motion`.

```bash
npm install
npm run dev
```

## Routes

| URL | Page |
|---|---|
| `/` | Landing page: floating photos, "Start Journey" zooms through to `/years` |
| `/years` | Every year in `YEARS` (2025, 2026), each as a 12-month timeline |
| `/:year` | One year's timeline |
| `/:year/:month` | Zoom-parallax intro, then the day scrubber. `month` is 1–12 |

## Adding photos

Put files in `src/photos/<year>/<month>/`, named after the day: `14.webp` or `14-first-snow.webp`.
They're picked up automatically. Months without files show placeholders. See `src/photos/README.md`.

## Files

For what every component and page does (and their props), see [docs/COMPONENTS.md](docs/COMPONENTS.md).

- `src/components/year-timeline.tsx`: the 12 month cards. Layout constants are at the top.
- `src/components/liquid-metal-button.tsx`: the "View days" button.
- `src/components/zoom-parallax.tsx`: the scroll-driven zoom into a month.
- `src/components/timeline-scrubber-days.tsx`: the day scrubber.
- `src/data/photos.ts`: photo discovery, placeholders, `YEARS`.
- `src/assets/chick.svg`: the chick home button (from `chick-source.svg`, the original artwork, with its background square removed and cropped).

## Deploying

Any static host works, but it needs a SPA fallback (serve `index.html` for every path) so
direct visits to `/2026/11` work.
