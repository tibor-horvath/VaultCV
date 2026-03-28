import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { RootRoute } from './routes/RootRoute'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [{ path: '/', element: <RootRoute /> }],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
