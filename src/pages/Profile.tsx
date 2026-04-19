import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, signOut, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

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
