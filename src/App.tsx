import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home'
import Create from './pages/Create'
import History from './pages/History'
import Journal from './pages/Journal'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'
import BottomNav from './components/BottomNav'

function AppContent() {
  const location = useLocation()
  const [onboardingComplete, setOnboardingComplete] = useState(() => 
    localStorage.getItem('artly_onboarding_complete') === 'true'
  )

  // If onboarding is not complete, redirect to /onboarding
  if (!onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // BottomNav should not show on /onboarding or / routes
  const showBottomNav = location.pathname !== '/' && location.pathname !== '/onboarding'

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Home />} />
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
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
