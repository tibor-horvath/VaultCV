import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { NotFoundRedirect } from './routes/NotFoundRedirect'
import { RootRoute } from './routes/RootRoute'
import { CvPdfRoute } from './routes/CvPdfRoute'
import { AdminShareRoute } from './routes/AdminRoute'
import { AdminDashboardRoute } from './routes/AdminDashboardRoute'
import { AdminEditorRoute } from './routes/AdminEditorRoute'
import { AdminSettingsRoute } from './routes/AdminSettingsRoute'

/** In production, `/cv/pdf` is not a user-facing page — redirect home. Dev keeps the layout + preview route. */
const cvPdfElement = import.meta.env.DEV ? <CvPdfRoute /> : <Navigate to="/" replace />

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <RootRoute /> },
      { path: 'cv/pdf', element: cvPdfElement },
      {
        path: 'admin',
        element: <Outlet />,
        children: [
          { index: true, element: <AdminDashboardRoute /> },
          { path: 'share', element: <AdminShareRoute /> },
          { path: 'editor', element: <AdminEditorRoute /> },
          { path: 'settings', element: <AdminSettingsRoute /> },
        ],
      },
      { path: '*', element: <NotFoundRedirect /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
