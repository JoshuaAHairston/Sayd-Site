import { Outlet, ScrollRestoration, useLocation } from "react-router"
import ChickHomeLink from "../components/chick-home-link"

export default function Layout() {
  const { pathname } = useLocation()
  return (
    <>
      {/* every page after the hero gets the chick in the top-left corner */}
      {pathname !== "/" && <ChickHomeLink />}
      <Outlet />
      {/* new pages start at the top; Back restores where you were on the year page */}
      <ScrollRestoration />
    </>
  )
}
