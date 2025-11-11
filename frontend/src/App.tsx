import { Route, Routes } from 'react-router-dom'
import CreateGame from './pages/CreateGame'
import GameLinks from './pages/GameLinks'
import ViewResult from './pages/ViewResult'
import AdminDashboard from './pages/AdminDashboard'
import NavBar from './components/NavBar'
import Background from './components/Background'

export default function App() {
  return (
    <div className="min-h-dvh relative">
      <Background />
      <NavBar />
      <main className="relative z-10 px-4 pt-24 pb-8">
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
