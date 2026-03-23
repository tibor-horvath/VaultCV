import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { CvRoute } from './routes/CvRoute'
import { LandingRoute } from './routes/LandingRoute'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <LandingRoute /> },
      { path: '/cv', element: <CvRoute /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
