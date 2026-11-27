import { Link } from "react-router"
import chickUrl from "../assets/chick.svg"

/** Fixed top-left chick that takes you back to the hero page. */
export function ChickHomeLink() {
  return (
    <Link
      to="/"
      aria-label="Back to the start"
      title="Back to the start"
      className="group fixed left-3 top-1 z-50 block rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-orange-400 md:left-5"
    >
      <img
        src={chickUrl}
        alt=""
        width={40}
        height={46}
        draggable={false}
        className="h-[46px] w-10 object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:-rotate-6 group-hover:scale-110"
      />
    </Link>
  )
}

export default ChickHomeLink
