import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Profile() {
  const { user, signOut, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [currentTheme, setCurrentTheme] = useState<string>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('artly_theme') || 'dark'
    setCurrentTheme(savedTheme)
  }, [])

  const applyTheme = (theme: string) => {
    if (theme === 'light') {
      document.body.classList.add('theme-light')
    } else {
      document.body.classList.remove('theme-light')
    }
    setCurrentTheme(theme)
    localStorage.setItem('artly_theme', theme)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {user ? (
        <>
          {/* Avatar */}
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt={user.email || 'Profile'} 
              className="w-24 h-24 rounded-full object-cover border-4 border-surface3"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          {/* User Info */}
          <div className="text-center mt-6">
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              {user.user_metadata?.full_name || user.email || 'User'}
            </h2>
            <p className="text-text-secondary">
              {user.email}
            </p>
          </div>

          {/* Appearance Section */}
          <div className="mt-8 w-full max-w-sm">
            <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-3)' }}>
              Appearance
            </div>
            <div className="flex gap-3">
              {/* Dark theme card */}
              <div
                onClick={() => applyTheme('dark')}
                className={`flex-1 h-14 p-2 rounded-lg cursor-pointer transition-all duration-200 relative ${
                  currentTheme === 'dark' ? 'border-[var(--color-primary)]' : ''
                }`}
                style={{
                  backgroundColor: '#0F0F1A',
                  border: '1px solid #3a3a5c'
                }}
              >
                {currentTheme === 'dark' && (
                  <Check size={14} className="absolute top-1 right-1" style={{ color: 'var(--color-primary)' }} />
                )}
                <div className="flex gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0F0F1A' }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6C3CE1' }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF3D71' }} />
                </div>
                <div className="text-xs font-semibold text-white">Artisan dark</div>
              </div>

              {/* Light theme card */}
              <div
                onClick={() => applyTheme('light')}
                className={`flex-1 h-14 p-2 rounded-lg cursor-pointer transition-all duration-200 relative ${
                  currentTheme === 'light' ? 'border-[var(--color-primary)]' : ''
                }`}
                style={{
                  backgroundColor: '#F7F1E8',
                  border: '1px solid #C8B89A'
                }}
              >
                {currentTheme === 'light' && (
                  <Check size={14} className="absolute top-1 right-1" style={{ color: 'var(--color-primary)' }} />
                )}
                <div className="flex gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F7F1E8' }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#B05E3A' }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4A7A50' }} />
                </div>
                <div className="text-xs font-semibold" style={{ color: '#1C1209' }}>Studio light</div>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={signOut}
            className="mt-8 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
            👤 Profile
          </h1>
          
          <p className="text-text-secondary mb-8">
            Sign in to view your profile and saved projects
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={signInWithGoogle}
              className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              Sign in with Google
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 text-text-primary hover:text-white font-medium transition-colors duration-200"
            >
              Continue as Guest
            </button>
          </div>
        </>
      )}
    </div>
  )
}
