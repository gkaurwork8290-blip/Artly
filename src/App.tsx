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
import { useEffect } from 'react'
import { Analytics, identifyUser } from './lib/analytics'

function AppContent() {
  const location = useLocation()
  const { user, loading } = useAuth()
  const onboardingComplete = localStorage.getItem('artly_onboarding_complete') === 'true'
  const hasSkill = !!localStorage.getItem('artly_skill')

  // Identify user in Posthog when auth resolves
  useEffect(() => {
    if (loading) return
    if (user) {
      identifyUser(user.id, {
        email: user.email,
        name: user.user_metadata?.full_name,
        user_type: 'free',
      })
    }
  }, [user, loading])

  // Track app opened on first load
  useEffect(() => {
    if (loading) return
    const userType = user ? 'free' : 'guest'
    Analytics.appOpened(userType)
  }, [loading])

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
