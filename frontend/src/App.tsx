import { Route, Routes } from 'react-router-dom'
import CreateGame from './pages/CreateGame'
import GameLinks from './pages/GameLinks'
import ViewResult from './pages/ViewResult'
import AdminDashboard from './pages/AdminDashboard'
import NavBar from './components/NavBar'

export default function App() {
  return (
    <div className="min-h-dvh relative">
      <NavBar />
      <main
        className="relative z-10 px-4"
        style={{
          paddingTop: 'calc(var(--nav-top-offset, 5.5rem) + 1.5rem)',
          paddingBottom: 'calc(var(--nav-bottom-offset, 0rem) + 1.5rem)',
        }}
      >
        <Routes>
          <Route path="/" element={<CreateGame />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/game/:gameId/links" element={<GameLinks />} />
          <Route path="/game/:gameId/token/:token" element={<ViewResult />} />
        </Routes>
      </main>
    </div>
  )
}
