import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Create from './pages/Create'
import History from './pages/History'
import Journal from './pages/Journal'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'
import BottomNav from './components/BottomNav'
import { AuthProvider } from './contexts/AuthContext'

function AppContent() {
  const location = useLocation()
  const [onboardingComplete, setOnboardingComplete] = useState(() => 
    localStorage.getItem('artly_onboarding_complete') === 'true'
  )

  // If onboarding is not complete, redirect to /onboarding
  if (!onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // If onboarding is complete and user is on root, redirect to /create
  if (onboardingComplete && location.pathname === '/') {
    return <Navigate to="/create" replace />
  }

  // BottomNav should not show on /onboarding or / routes
  const showBottomNav = location.pathname !== '/' && location.pathname !== '/onboarding'

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route 
          path="/onboarding" 
          element={<Onboarding setOnboardingComplete={setOnboardingComplete} />} 
        />
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
