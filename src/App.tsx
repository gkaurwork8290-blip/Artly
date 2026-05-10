import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Create from './pages/Create'
import Saved from './pages/Saved'
import Journal from './pages/Journal'
import Profile from './pages/Profile'
import Project from './pages/Project'
import Onboarding from './pages/Onboarding'
import BottomNav from './components/BottomNav'
import { AuthProvider } from './contexts/AuthContext'

function AppContent() {
  const location = useLocation()
  const onboardingComplete = localStorage.getItem('artly_onboarding_complete') === 'true'

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
          element={<Onboarding />} 
        />
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
