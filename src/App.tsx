import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Create from './pages/Create'
import History from './pages/History'
import Journal from './pages/Journal'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'

function AppContent() {
  const location = useLocation()
  const showBottomNav = location.pathname !== '/'

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/history" element={<History />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
