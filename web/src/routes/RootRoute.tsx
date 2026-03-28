import { useAppView } from '../lib/appView'
import { CvRoute } from './CvRoute'
import { LandingRoute } from './LandingRoute'

export function RootRoute() {
  const { view } = useAppView()
  return view === 'cv' ? <CvRoute /> : <LandingRoute />
}
