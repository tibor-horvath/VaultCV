import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { NotFoundRedirect } from './routes/NotFoundRedirect'
import { RootRoute } from './routes/RootRoute'
import { CvPdfRoute } from './routes/CvPdfRoute'
import { AdminRoute } from './routes/AdminRoute'
import { AdminEditorRoute } from './routes/AdminEditorRoute'

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
          { index: true, element: <AdminRoute /> },
          { path: 'editor/:kind', element: <AdminEditorRoute /> },
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
