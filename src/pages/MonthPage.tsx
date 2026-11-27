import { Link, useParams } from "react-router"
import PageFadeIn from "../components/page-fade-in"
import { useFadeNavigate } from "../components/use-fade-navigate"
import TimelineScrubber from "../components/timeline-scrubber-days"
import ZoomParallax from "../components/zoom-parallax"
import { MONTH_NAMES, getStops, isKnownYear, isPlaceholderMonth } from "../data/photos"
import NotFoundPage from "./NotFoundPage"

export default function MonthPage() {
  const { year, month } = useParams()
  // back to the years page fades to its white background
  const back = useFadeNavigate("bg-white")
  // previous / next month fade through black, like "View days"
  const monthFade = useFadeNavigate("bg-black")
  const y = Number(year)
  const m = Number(month) // 1-12 from the URL
  const valid = /^\d{4}$/.test(year ?? "") && isKnownYear(y) && /^\d{1,2}$/.test(month ?? "") && m >= 1 && m <= 12
  if (!valid) return <NotFoundPage />

  const stops = getStops(y, m)
  const monthName = MONTH_NAMES[m - 1]
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }

  return (
    <main className="bg-black">
      {/* "View days" and the previous/next links both arrive here through black */}
      <PageFadeIn colorClass="bg-black" />
      {back.overlay}
      {monthFade.overlay}

      <Link
        {...back.fadeLink(`/years#month-${y}-${m}`)}
        className="group fixed left-16 top-3 z-50 rounded-full outline-none md:left-20"
      >
        {/* yellow → pink glow, shown on hover / keyboard focus */}
        <span
          aria-hidden
          className="absolute -inset-1 translate-y-1 rounded-full bg-linear-to-r from-yellow-300 via-amber-200 to-pink-400 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-90 group-focus-visible:opacity-90"
        />
        <span className="relative block rounded-full border border-white/30 bg-black/60 px-4 py-2 text-sm text-white backdrop-blur transition-colors group-hover:border-white/60 group-focus-visible:border-white/60">
          ← {y}
        </span>
      </Link>

      {stops.length > 0 && (
        <ZoomParallax
          key={`${y}-${m}`}
          images={stops.map((s) => s.photos[0].src)}
          eyebrow={String(y)}
          title={monthName}
        />
      )}

      {/* The parallax ends with the first photo filling the screen; the same
          photo, blurred, sits behind the scrubber so the zoom lands on it. */}
      <section id="days" className="relative flex min-h-screen flex-col overflow-hidden px-4 py-16 md:px-10">
        {stops[0] && (
          <img
            src={stops[0].photos[0].src}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col">
          {stops.length > 0 ? (
            <TimelineScrubber key={`${y}-${m}`} year={y} month={m - 1} stops={stops} />
          ) : (
            <p className="rounded-xl bg-white p-10 text-center text-neutral-500">No photos for this month yet.</p>
          )}

          {isPlaceholderMonth(y, m) && (
            <p className="mt-4 text-center text-xs text-white/60">
              Placeholder photos. Add your own in src/photos/{y}/{String(m).padStart(2, "0")}/
            </p>
          )}

          <nav aria-label="Months" className="mt-8 flex max-md:mt-auto max-md:pt-8 items-center justify-between text-sm text-white/85">
            {isKnownYear(prev.y) ? (
              <Link {...monthFade.fadeLink(`/${prev.y}/${prev.m}`)} className="rounded-full bg-white/10 px-4 py-2 backdrop-blur hover:bg-white/20">
                ← {MONTH_NAMES[prev.m - 1]} {prev.y !== y ? prev.y : ""}
              </Link>
            ) : <span />}
            {isKnownYear(next.y) ? (
              <Link {...monthFade.fadeLink(`/${next.y}/${next.m}`)} className="rounded-full bg-white/10 px-4 py-2 backdrop-blur hover:bg-white/20">
                {MONTH_NAMES[next.m - 1]} {next.y !== y ? next.y : ""} →
              </Link>
            ) : <span />}
          </nav>
        </div>
      </section>
    </main>
  )
}
