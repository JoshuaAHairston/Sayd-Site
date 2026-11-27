import { Link } from "react-router"

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-6xl font-semibold tracking-tight text-neutral-800">404</p>
      <p className="text-neutral-500">There's nothing at this address.</p>
      <Link to="/years" className="rounded-full bg-black px-5 py-2 text-sm text-white">
        Go to the timeline
      </Link>
    </main>
  )
}
