import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { NotFoundRedirect } from './routes/NotFoundRedirect'
import { RootRoute } from './routes/RootRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <RootRoute /> },
      { path: '*', element: <NotFoundRedirect /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
