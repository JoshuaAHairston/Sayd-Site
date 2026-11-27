# Photos

One folder per year, one per month (`01` = January … `12` = December).

Name each file after the day it was taken, optionally followed by a title:

```
2025/11/03.webp               -> November 3, titled "November 3"
2025/11/14-first-snow.jpg     -> November 14, titled "First snow"
```

- Supported: jpg, jpeg, png, webp, avif.
- Several photos per day are fine: give them the same day, e.g. `13-cake.jpg`,
  `13-candles.jpg`. They show in filename order; a number-only suffix
  (`13-1.jpg`, `13-2.jpg`, `13-10.jpg`) sorts by number and keeps the default
  "January 13" title. The scrubber still has one stop per day, and days with
  more than one photo get back/forward arrows (also swipe, or Up/Down keys).
- No need to resize before adding. Every photo in a month is preloaded when you
  open that month.
- A month with no files shows placeholder photos.
- Smaller WebP copies are made automatically at build time: 640px for the year-page
  cards and 1600px for month pages. Your original files aren't published.
- Hero photos (`src/photos/hero/`) are likewise served as 800px WebP copies, since
  they're shown small. Upper- or lowercase extensions both work (`.JPEG`, `.jpg`).

Files are discovered automatically by `src/data/photos.ts`. No code changes needed.
To add another year, create its folder and add the year to `YEARS` in that file.

## Landing page photos

`hero/` holds the photos that float on the landing page (up to 8). They fill
the slots in alphabetical order, so prefix them to control placement:
`1-beach.jpg`, `2-city.jpg`, …
