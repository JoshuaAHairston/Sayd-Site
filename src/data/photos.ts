import type { TimelineStop } from "../components/timeline-scrubber-days";

/** Years shown on the home page, in order. */
export const YEARS = [2025, 2026] as const;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ---------------------------------------------------------------------------
Real photos

Drop files into src/photos/<year>/<month>/ and they are picked up automatically.
Name each file after the day it was taken, optionally followed by a title:

  src/photos/2025/11/03.webp                 -> Nov 3, titled "November 3"
  src/photos/2025/11/14-first-snow.jpg       -> Nov 14, titled "First snow"

Several photos can share a day: 13-cake.jpg, 13-candles.jpg. They are grouped
under that day and shown in filename order (13-1, 13-2, ... 13-10 sort by number).
Resize to ~1600px wide (WebP) first.
--------------------------------------------------------------------------- */

// Plain imports (no ?query), so imagetools leaves the originals untouched — it only
// processes image imports that carry a query, like the thumbnails below.
const files = import.meta.glob<string>(
  "../photos/*/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  { eager: true, import: "default" },
);

// The same files again, as small WebP copies for the year-page month cards
// (made at build time by vite-imagetools; see vite.config.ts). Cards are ~280px
// wide, so 640px stays sharp on high-density screens at a fraction of the size.
const thumbFiles = import.meta.glob<string>(
  "../photos/*/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  { eager: true, query: "?w=640&format=webp", import: "default" },
);
/** full-size photo URL -> its thumbnail URL */
const thumbBySrc: Record<string, string> = {};
for (const path of Object.keys(files)) if (thumbFiles[path]) thumbBySrc[files[path]] = thumbFiles[path];

const FILE_RE = /photos\/(\d{4})\/(\d{2})\/(\d{1,2})(?:[-_ ]([^/]*))?\.[a-z]+$/i;

function titleFromSlug(slug: string) {
  const words = slug.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const realStops: Record<string, TimelineStop[]> = {};
for (const path of Object.keys(files).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
  const match = path.match(FILE_RE);
  if (!match) {
    console.warn(`[photos] skipped "${path}": file name must start with the day, e.g. 07.webp or 07-title.webp`);
    continue;
  }
  const [, y, m, d, slug] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    console.warn(`[photos] skipped "${path}": day ${day} is not in ${y}-${m}`);
    continue;
  }
  const key = `${year}-${m}`;
  const list = (realStops[key] ??= []);
  // a purely numeric suffix (13-2.jpg) is just an ordering hint, not a title
  const title = slug && !/^\d+$/.test(slug.trim()) ? titleFromSlug(slug) : `${MONTH_NAMES[month - 1]} ${day}`;
  const photo = { src: files[path], title };
  const existing = list.find((s) => s.day === day);
  if (existing) existing.photos.push(photo);
  else list.push({ day, photos: [photo] });
}

/* ---------------------------------------------------------------------------
Placeholders — used for any month that has no real photos yet.
Deterministic per month, so the same days show up on every visit.
--------------------------------------------------------------------------- */

const PLACEHOLDER_TITLES = [
  "Morning light", "Out walking", "Golden hour", "City lights", "Quiet street",
  "By the water", "Long shadows", "Weekend away", "Rooftops", "Late night",
  "Fresh air", "Little moments", "Open road", "First coffee",
];

function seeded(seed: number) {
  // mulberry32
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function placeholderStops(year: number, month: number): TimelineStop[] {
  const rand = seeded(year * 100 + month);
  const total = daysInMonth(year, month);
  const count = 5 + Math.floor(rand() * 4); // 5-8 photos
  const days = new Set<number>();
  while (days.size < count) days.add(1 + Math.floor(rand() * total));
  return [...days]
    .sort((a, b) => a - b)
    .map((day, i) => ({
      day,
      photos: [
        {
          src: `https://picsum.photos/seed/sayd-${year}-${month}-${day}/1600/1000`,
          title: PLACEHOLDER_TITLES[(month * 3 + i) % PLACEHOLDER_TITLES.length],
        },
      ],
    }));
}

/* ---------------------------------------------------------------------------
Public API
--------------------------------------------------------------------------- */

/** month is 1-12. Returns one stop per day (each with its photos), sorted by day; real photos win over placeholders. */
export function getStops(year: number, month: number): TimelineStop[] {
  const real = realStops[`${year}-${String(month).padStart(2, "0")}`];
  if (real?.length) return [...real].sort((a, b) => a.day - b.day);
  return placeholderStops(year, month);
}

export function isPlaceholderMonth(year: number, month: number) {
  return !realStops[`${year}-${String(month).padStart(2, "0")}`]?.length;
}

/** Small thumbnail per month for the year cards, keyed 1-12. */
export function getMonthThumbnails(year: number): Partial<Record<number, string>> {
  const out: Partial<Record<number, string>> = {};
  for (let m = 1; m <= 12; m++) {
    const first = getStops(year, m)[0]?.photos[0];
    if (!first) continue;
    out[m] = isPlaceholderMonth(year, m)
      ? first.src.replace("/1600/1000", "/560/350")
      : (thumbBySrc[first.src] ?? first.src);
  }
  return out;
}

export const isKnownYear = (year: number) => (YEARS as readonly number[]).includes(year);

/* ---------------------------------------------------------------------------
Hero (landing page) photos

Put up to 8 files in src/photos/hero/. They fill the floating slots in
alphabetical order, so prefix them to control placement: 1-beach.jpg, 2-....
Empty slots use placeholders.
--------------------------------------------------------------------------- */

// Served as 800px-wide WebP copies (made by vite-imagetools at build time): the
// slots are at most ~210x260 on screen, and phone photos shrunk 15-20x while the
// floating effect moves them every frame get rendered grainy and jagged.
const heroFiles = import.meta.glob<string>(
  "../photos/hero/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  { eager: true, query: "?w=800&format=webp", import: "default" },
);

export const HERO_SLOTS = 8;

export function getHeroImages(): string[] {
  const real = Object.keys(heroFiles)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((k) => heroFiles[k]);
  return Array.from(
    { length: HERO_SLOTS },
    (_, i) => real[i] ?? `https://picsum.photos/seed/sayd-hero-${i + 1}/480/600`,
  );
}
