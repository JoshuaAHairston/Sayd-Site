import React from "react";
import { LiquidMetalButton } from "./liquid-metal-button";
import { LazyMotion, domAnimation, m } from "motion/react";
import { useFadeNavigate } from "./use-fade-navigate";

/* ---------- constants ---------- */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Theme = "orange" | "blue" | "purple";
const THEMES: Theme[] = ["orange", "blue", "purple"];

const BG: Record<Theme, string> = {
  orange: "bg-orange-50",
  blue: "bg-blue-50",
  purple: "bg-purple-50",
};
const TEXT: Record<Theme, string> = {
  orange: "text-orange-500",
  blue: "text-blue-600",
  purple: "text-purple-600",
};
const BORDER: Record<Theme, string> = {
  orange: "border-orange-100",
  blue: "border-blue-100",
  purple: "border-purple-100",
};

/* ---------- layout maths (desktop) ---------- */
// Two columns, zig-zagging: even months on the left, odd months on the right.
// The right column is nudged down by RIGHT_OFFSET so the cards interleave.

const PAIR_STEP = 470; // vertical distance between rows of cards
const RIGHT_OFFSET = 150; // how far the right column sits below the left
const CARD_ANCHOR_Y = 180; // where the dashed path meets a card, from its top
const LEFT_X = 290; // centre x of left cards in the 1000-wide viewBox
const RIGHT_X = 710; // centre x of right cards
const BOTTOM_PAD = 400; // room for the last card

function cardTop(i: number) {
  return Math.floor(i / 2) * PAIR_STEP + (i % 2 === 1 ? RIGHT_OFFSET : 0);
}

function buildPath(count: number) {
  const pts = Array.from({ length: count }, (_, i) => ({
    x: i % 2 === 0 ? LEFT_X : RIGHT_X,
    y: cardTop(i) + CARD_ANCHOR_Y,
  }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const midX = (a.x + b.x) / 2;
    d += ` C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
  }
  return d;
}

/* ---------- pieces ---------- */

const Pin = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
  </svg>
);

interface MonthCardProps {
  id?: string;
  number: string;
  title: string;
  description?: string;
  image?: string;
  to: string;
  buttonLabel: string;
  theme: Theme;
  rotate: string;
  style?: React.CSSProperties;
  className?: string;
}

function MonthCard({
  id, number, title, description, image, to, buttonLabel, theme, rotate, style, className = "",
}: MonthCardProps) {
  // fades to black; MonthPage fades up from the same black
  const { fadeTo, overlay } = useFadeNavigate("bg-black");

  return (
    <div
      id={id}
      style={style}
      className={`relative w-full scroll-mt-40 md:w-[280px] transition-transform duration-300 hover:z-30 hover:scale-105 ${rotate} ${className}`}
    >
      <div className="bg-white p-2 rounded-[25px] shadow-[0px_10px_20px_0px_#D3D3D3] border border-neutral-100">
        <Pin className={`w-8 h-8 ${TEXT[theme]} z-20 mb-6 mx-auto`} />
        <div
          className={`${BG[theme]} border ${BORDER[theme]} rounded-[15px] p-[15px] h-full flex flex-col relative overflow-hidden`}
        >
          <span
            className={`${TEXT[theme]} text-4xl mb-5`}
            style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
          >
            {number}
          </span>
          {image && (
            <img
              src={image}
              alt=""
              loading="lazy"
              className="mb-3 aspect-[16/10] w-full rounded-[10px] object-cover"
            />
          )}
          <h3 className="text-2xl font-semibold text-neutral-800 leading-none mb-[10px]">
            {title}
          </h3>
          {description && (
            <p className="text-neutral-500 text-sm/5 tracking-tight mb-4">
              {description}
            </p>
          )}
          <div className="mt-auto flex justify-center pt-1">
            {/* the ripple plays while the page fades, so it's still visible */}
            <LiquidMetalButton label={buttonLabel} onClick={() => fadeTo(to)} />
          </div>
        </div>
      </div>
      {overlay}
    </div>
  );
}

/* ---------- component ---------- */

export interface YearTimelineProps {
  /** the year this timeline represents, e.g. 2026 */
  year: number;
  /**
   * Build the link for a month's button. month is 1-12.
   * Default: `/${year}/${month}`
   */
  getHref?: (year: number, month: number) => string;
  /** Optional short blurb per month, keyed 1-12 */
  descriptions?: Partial<Record<number, string>>;
  /** Optional thumbnail per month, keyed 1-12 */
  images?: Partial<Record<number, string>>;
  /** Heading shown above the timeline. Pass null to hide. Default: the year */
  heading?: string | null;
  buttonLabel?: string;
  className?: string;
}

export default function YearTimeline({
  year,
  getHref = (y, mo) => `/${y}/${mo}`,
  descriptions,
  images,
  heading,
  buttonLabel = "View days",
  className = "",
}: YearTimelineProps) {
  const count = 12;
  const height = Math.floor((count - 1) / 2) * PAIR_STEP + RIGHT_OFFSET + BOTTOM_PAD;
  const pathD = React.useMemo(() => buildPath(count), []);
  const title = heading === undefined ? String(year) : heading;

  return (
    <LazyMotion features={domAnimation}>
      <section
        id={`year-${year}`}
        aria-label={`${year} timeline`}
        className={`bg-white max-md:pt-10 max-md:pb-25 md:py-20 px-8 relative ${className}`}
      >
        {/* ruled-paper background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px)",
            backgroundSize: "100% 32px",
            marginTop: "4px",
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white" />

        <div className="max-w-6xl mx-auto relative z-10">
          {title && (
            <h2 className="mb-10 text-center text-5xl font-semibold tracking-tight text-neutral-800">
              {title}
            </h2>
          )}

          <div
            className="relative w-full max-w-[1000px] mx-auto flex flex-col space-y-8 md:space-y-0 md:block h-auto md:h-[var(--md-height)]"
            style={{ "--md-height": `${height}px` } as React.CSSProperties}
          >
            {/* dashed connecting path (desktop only) */}
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block z-0"
              viewBox={`0 0 1000 ${height}`}
              preserveAspectRatio="none"
              aria-hidden
            >
              <m.path
                d={pathD}
                stroke="currentColor"
                className="text-neutral-300"
                strokeWidth="2"
                strokeDasharray="8 6"
                fill="none"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -140 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </svg>

            {MONTH_NAMES.map((name, i) => {
              const month = i + 1;
              const isLeft = i % 2 === 0;
              return (
                <MonthCard
                  key={name}
                  id={`month-${year}-${month}`}
                  number={String(month).padStart(2, "0")}
                  title={name}
                  description={descriptions?.[month]}
                  image={images?.[month]}
                  to={getHref(year, month)}
                  buttonLabel={buttonLabel}
                  theme={THEMES[i % THEMES.length]}
                  rotate={isLeft ? "rotate-8" : "-rotate-8"}
                  // `top` only applies from md up, so it goes through a CSS variable
                  className={`md:absolute md:top-[var(--top)] ${isLeft ? "md:left-[15%]" : "md:right-[15%]"}`}
                  style={{ "--top": `${cardTop(i)}px` } as React.CSSProperties}
                />
              );
            })}
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
