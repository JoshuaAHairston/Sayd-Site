# Components & pages

What each file in `src/` does, how they connect, and the props you can pass.
For setup, routes and adding photos, see the [development guide](DEVELOPMENT.md).

## How the site flows

```
/  HeroPage ──"Start Journey" (zoom-through)──▶  /years  YearsPage
                                                    │  one YearTimeline per year
                                                    │  month card ▶ "View days"
                                                    ▼
                                             /:year/:month  MonthPage
                                                ZoomParallax ▶ TimelineScrubber
```

All routes are defined in `src/App.tsx` and render inside `Layout`.

---

## Pages (`src/pages/`)

### `Layout.tsx`
The wrapper around every route.
- Shows `ChickHomeLink` in the top-left on every page except the hero (`/`).
- Renders the current page through `<Outlet />`.
- Uses `<ScrollRestoration />`, so new pages open at the top and Back returns you to where you were.

### `HeroPage.tsx` — `/`
The landing page.
- Up to 8 photos (from `getHeroImages()`) float around the screen and drift with the mouse or touch, using `Floating` / `FloatingElement`.
- The title "A Journey." and a `LiquidMetalButton` labelled "Start Journey" fade in after the photos.
- Clicking the button plays `ZoomThroughTransition`, then goes to `/years`. It passes `fromHero: true` in the router state so the years page can fade in.
- If the visitor has reduced motion turned on, the zoom is skipped and the button goes straight to `/years`.
- `SLOTS` at the top of the file sets each floating photo's position, size and parallax depth.

### `YearsPage.tsx` — `/years`
The main timeline page.
- The "Our Timeline." heading uses the same italic style as the hero title.
- A sticky bar holds a `LiquidNavbar` of the years. Tapping a year scrolls there over 1.4 s (`YEAR_SCROLL_S`) and updates the URL hash (`#year-2025`); scrolling, swiping or a key press interrupts it. The water drop follows whichever year is under the bar, but stays on the tapped year during the auto-scroll. A soft yellow-to-pink glow and gradient hairline sit under the bar.
- Renders one `YearTimeline` for each year in `YEARS` (from `src/data/photos.ts`).
- When you arrive from the hero, the page fades in from a slight zoom.
- When you arrive from a month page's back link, the page fades up from white.
- Ends with a "Back to the start" link to `/`.

### `YearPage.tsx` — `/:year`
A single year's timeline, with a "← All years" link. Shows `NotFoundPage` if the year isn't 4 digits or isn't in `YEARS`.

### `MonthPage.tsx` — `/:year/:month`
One month's photos. `month` in the URL is 1–12.
1. A fixed back link returns to that month's card on `/years` (`#month-2025-9`). It has a faint white border and a yellow-to-pink glow on hover or focus. Clicking it fades the page to white before navigating; cmd/ctrl-click still opens a new tab.
- When opened from a "View days" button, the page fades up from black.
2. `ZoomParallax` zooms into the month's photos as you scroll. The year and month name sit over the centre photo.
3. The `#days` section shows `TimelineScrubber` over a blurred copy of the first photo.
4. Previous/next month links appear at the bottom, but only within the years in `YEARS`.
- A month with no photos shows an empty-state message. A month still using placeholders shows a small note.
- Invalid params show `NotFoundPage`.
- Both the parallax and the scrubber are keyed by year and month, so moving between months resets them.

### `NotFoundPage.tsx`
A 404 message with a link back to `/years`. Used by the `*` route and by pages whose params are invalid.

---

## Components (`src/components/`)

### `liquid-metal-button.tsx` — `LiquidMetalButton`
The pill button with an animated liquid-metal rim, adapted from 21st.dev and drawn with `@paper-design/shaders`.

| Prop | Type | Notes |
|---|---|---|
| `label` | `string` | Button text |
| `onClick` | `() => void` | Click handler |
| `viewMode` | `"text" \| "icon"` | Text pill or a compact icon button |
| `className` | `string` | Extra classes on the outer wrapper |

- **Hover or keyboard focus:** the button grows to 1.08×, the inside turns dark grey, and the label lightens.
- **Click:** shows a ripple from the click point, or from the centre when triggered by keyboard.
- **Performance:** each shader uses one WebGL context, and browsers allow only about 16 at a time. Each button therefore starts its shader only when it's within 200px of the screen and releases it (`dispose()`) when it scrolls away or unmounts. That keeps all 24 month buttons working.

### `liquid-glass-navbar.tsx` — `LiquidNavbar`
The water-pill navbar ("Waterline", by guglielmogiannattasio.it). The active item is a drop that stretches, splits into droplets on long jumps and ripples; the cursor lifts the surface. Drawn by one small WebGL shader that pauses off-screen, with a CSS drop as fallback.

| Prop | Type | Notes |
|---|---|---|
| `items` | `{ label, href?, icon?, fx? }[]` | `fx` is the icon's tap animation; `"none"` for label-only items |
| `active` / `defaultActive` | `number` | Controlled / uncontrolled active index |
| `onSelect` | `(index, item) => void` | Every tap, including the active item (added for the year nav) |
| `onChange` | `(index, item) => void` | Only when the active item changes |
| `tone` | `"light" \| "dark"` | Water tint for the background behind it |
| `compact` | `boolean` | `true` icons only; `false` keeps labels on narrow screens (the years page uses `false`) |
| `ariaLabel`, `sound`, `className`, `style` | | |

### `morphing-arrow-button.tsx` — `MorphingArrowButton`
A round arrow button that stretches into a pill on hover or keyboard focus (adapted from a morphing-arrow-button snippet). The left button grows rightward and the right one leftward, so both grow toward the middle of what they sit on. Used by `TimelineScrubber` to flip through a day's photos.

| Prop | Type | Notes |
|---|---|---|
| `direction` | `"left" \| "right"` | |
| `label` | `string` | Accessible name |
| `onClick` | `() => void` | |
| `size` | `number` | Circle diameter in px; default 48 |
| `className` | `string` | Put positioning here (it wraps a fixed-width slot) |

### `year-timeline.tsx` — `YearTimeline`
One year shown as 12 month cards.
- **Desktop:** the cards zig-zag in two columns joined by a dashed curved path.
- **Mobile:** the cards stack in a single column.
- Each card has a pin, the month name, a thumbnail and a `LiquidMetalButton`. Clicking the button fades the page to black (the ripple plays during the fade), then navigates to the month.
- Cards cycle through orange, blue and purple themes.

| Prop | Type | Notes |
|---|---|---|
| `year` | `number` | Required |
| `getHref` | `(year, month) => string` | Link for each card; default `/${year}/${month}` |
| `images` | `Partial<Record<1–12, string>>` | Thumbnail per month |
| `descriptions` | `Partial<Record<1–12, string>>` | Text per month |
| `heading` | `string \| null` | Defaults to the year; `null` hides it |
| `buttonLabel` | `string` | Card button text; default "View days" |
| `className` | `string` | Extra classes on the section |

- **Anchors:** the section gets `id="year-YYYY"` and each card gets `id="month-YYYY-M"`. The year nav and the month page's back link scroll to these.
- **Layout:** the constants at the top of the file (`PAIR_STEP`, `RIGHT_OFFSET`, `LEFT_X`, …) control spacing in the desktop layout.

### `zoom-parallax.tsx` — `ZoomParallax`
A port of olivierlarose/zoom-parallax.
- The component sits in a tall scroll runway with a full-screen black stage that stays fixed while you scroll through it.
- Seven photo tiles grow at different rates. The centre tile grows exactly 4×, until it fills the screen.

| Prop | Type | Notes |
|---|---|---|
| `images` | `string[]` | Up to 7; the first is the centre tile. Repeats if fewer. |
| `title` | `string` | Large label on the centre tile; fades out as you scroll |
| `eyebrow` | `string` | Small label above the title |
| `runway` | `string` | Scroll length; default `200vh` (one screen of scrolling) |

A "Scroll to zoom in" hint shows at the bottom and fades out as soon as you start scrolling.

### `timeline-scrubber-days.tsx` — `TimelineScrubber`
A draggable track with one tick per day of the month. Moving the handle shows the photo and title for the nearest day that has one.
- **Controls:** drag the handle, or, when it's focused, use the left and right arrow keys to move between photo days (Home and End jump to the first and last).
- **Several photos in a day:** a day can hold more than one photo. The handle still snaps between days; on a multi-photo day, `MorphingArrowButton`s (back/forward), a "2 / 3" counter, swiping the photo, or the Up/Down keys flip through that day's photos. The ruler shows a dot per photo (max 5) under that day's number.
- **Labels:** days with photos have labels. On mobile, a label is hidden when it's closer than 3 days to the previous one, so labels don't overlap.

| Prop | Type | Notes |
|---|---|---|
| `stops` | `TimelineStop[]` | Days with photos (see below) |
| `year` | `number` | Full year |
| `month` | `number` | **0–11** (0 = January), unlike the URL |
| `heading` | `string` | Defaults to "September 2025" style |
| `className` | `string` | |

`TimelineStop` has the following fields:
- `day` (1-based) and `photos`: a list of `{ src, title }`, in display order.
- Optional `value`, `valueSuffix` and `valueLabel`: a number shown as a rolling counter. It's hidden when `value` is not set, which is currently always.

### `parallax-floating.tsx` — `Floating`, `FloatingElement`
The mouse-follow parallax behind the hero, adapted from 21st.dev.
- `Floating` tracks the pointer (mouse or touch). On every animation frame, it eases each child toward an offset scaled by that child's `depth`.
  - Props: `sensitivity` (default `1`; negative values move the other way), `easingFactor` (default `0.05`) and `className`.
- `FloatingElement` is a positioned child that registers itself with the parent.
  - Props: `depth` (higher moves more) and `className`.
- Positions are written straight to `style.transform`, so React doesn't re-render as the pointer moves.

### `zoom-through-transition.tsx` — `ZoomThroughTransition`
Wraps content and, when `active` turns true, scales it up quickly (to 20× by default) while fading it out, then calls `onDone`. It is plain CSS keyframes; the original used `@editframe/react`, which isn't needed.

| Prop | Default | Notes |
|---|---|---|
| `active` | — | Starts the animation |
| `onDone` | — | Called when the zoom ends |
| `targetScale` | `20` | |
| `duration` | `1800` | Milliseconds |
| `fadeStartPercent` | `70` | When the fade-out begins |
| `transformOrigin` | `"center center"` | |
| `className`, `style` | | Applied to the wrapper |
| `backdropClassName` | | A layer behind the content that fades but doesn't scale. Put solid backgrounds here, not in `className`: a full-screen fill scaled 20× flickers at the edges. |

### `use-fade-navigate.tsx` — `useFadeNavigate`, and `page-fade-in.tsx` — `PageFadeIn`
The fade-between-pages transition.
- `useFadeNavigate(colorClass)` returns `{ fadeTo, overlay }`. Render `overlay`; calling `fadeTo(href)` covers the screen with `colorClass` over `FADE_OUT_S` (0.5 s), then navigates with `{ fadeIn: true }` in the router state. Navigation runs on a timer, so it still happens if animation frames are paused.
- `<PageFadeIn colorClass="…" />` goes on the destination page. When `fadeIn` is set, it fades the same colour away over `FADE_IN_S` (0.7 s).
- With reduced motion on, `fadeTo` navigates immediately with no fade.
- Used by `YearTimeline` → `MonthPage` (black) and `MonthPage` back link → `YearsPage` (white).

### `chick-home-link.tsx` — `ChickHomeLink`
The baby chick fixed in the top-left corner; it links back to the hero. It hops and tilts on hover and shows an orange ring on keyboard focus. Rendered by `Layout` on every page except `/`.

---

## Styling
The site is light-only. There are no `dark:` classes, and `color-scheme: light` in `src/index.css` keeps browser UI light even on devices set to dark mode.

## Data (`src/data/photos.ts`)
Not a component, but every page reads from it.

| Export | What it does |
|---|---|
| `YEARS` | Years shown on the site (`[2025, 2026]`) |
| `MONTH_NAMES`, `daysInMonth(year, month)` | Helpers; `month` is 1–12 |
| `getStops(year, month)` | One stop per day for a month (each with its `photos`): real ones from `src/photos/YYYY/MM/`, otherwise placeholders |
| `isPlaceholderMonth(year, month)` | `true` if the month has no real photos yet |
| `getMonthThumbnails(year)` | One thumbnail per month for the year cards. Real photos get a 640px WebP copy made at build time by `vite-imagetools` (see `vite.config.ts`); the original is untouched and still used on month pages. |
| `isKnownYear(year)` | Whether a year is in `YEARS` |
| `getHeroImages()` | 8 hero photos: real ones from `src/photos/hero/` (served as 800px WebP copies), otherwise placeholders |

How photos are picked up:
- Photos are found at build time with `import.meta.glob`, so adding a file is all it takes. See `src/photos/README.md` for the naming rules.
- Placeholder months use picsum.photos images, generated from a fixed seed so every visit shows the same days.

## Assets (`src/assets/`)
- `chick.svg` is the chick the site uses, cleaned up and cropped.
- `chick-source.svg` is the original unedited artwork, kept as a master copy.
