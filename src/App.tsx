import { RouterProvider, createBrowserRouter } from "react-router"
import HeroPage from "./pages/HeroPage"
import Layout from "./pages/Layout"
import MonthPage from "./pages/MonthPage"
import NotFoundPage from "./pages/NotFoundPage"
import YearPage from "./pages/YearPage"
import YearsPage from "./pages/YearsPage"

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <HeroPage /> },
      { path: "/years", element: <YearsPage /> },
      { path: "/:year", element: <YearPage /> },
      { path: "/:year/:month", element: <MonthPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
