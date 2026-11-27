import { Link, useParams } from "react-router"
import YearTimeline from "../components/year-timeline"
import { getMonthThumbnails, isKnownYear } from "../data/photos"
import NotFoundPage from "./NotFoundPage"

export default function YearPage() {
  const { year } = useParams()
  const y = Number(year)
  if (!/^\d{4}$/.test(year ?? "") || !isKnownYear(y)) return <NotFoundPage />

  return (
    <main>
      <div className="pl-16 pr-8 pt-4 md:pl-20">
        <Link to="/years" className="text-sm text-neutral-500 hover:text-neutral-900">← All years</Link>
      </div>
      <YearTimeline year={y} images={getMonthThumbnails(y)} />
    </main>
  )
}
