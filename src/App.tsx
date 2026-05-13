import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Create from './pages/Create'
import Saved from './pages/Saved'
import Journal from './pages/Journal'
import Profile from './pages/Profile'
import Project from './pages/Project'
import Onboarding from './pages/Onboarding'
import BottomNav from './components/BottomNav'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function hasUserData() {
  const journal = localStorage.getItem('artly_journal_entries')
  if (journal) {
    try { if (JSON.parse(journal).length > 0) return true } catch {}
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('artly_saved_') && localStorage.getItem(key) === 'true') return true
  }
  return false
}

function AppContent() {
  const location = useLocation()
  const { user, loading } = useAuth()
  const onboardingComplete = localStorage.getItem('artly_onboarding_complete') === 'true'
  const hasSkill = !!localStorage.getItem('artly_skill')

  if (loading) return null

  if (location.pathname === '/') {
    if (user && (onboardingComplete || hasSkill)) return <Navigate to="/create" replace />
    if (user && !onboardingComplete && !hasSkill) return <Navigate to="/onboarding" replace />
  }

  const showBottomNav = location.pathname !== '/' && location.pathname !== '/onboarding'

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/create" element={<Create />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/project" element={<Project />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
