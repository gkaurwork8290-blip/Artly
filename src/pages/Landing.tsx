import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Chrome } from 'lucide-react'

export default function Landing() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="flex flex-col items-center max-w-[400px] w-full mx-auto px-6">
        {/* Top section */}
        <div className="flex flex-col items-center">
          {/* Logo */}
          <div 
            className="w-10 h-10 rounded-xl mb-4"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
          
          {/* Wordmark */}
          <h1 className="text-2xl font-black mb-4 text-white">
            artly
          </h1>
          
          {/* Tagline */}
          <p 
            className="text-sm text-center mb-auto"
            style={{ color: 'var(--color-text-2)' }}
          >
            Your AI creative companion. Make art with what you have.
          </p>
        </div>

        {/* Bottom section */}
        <div className="mt-auto w-full flex flex-col gap-3">
          {/* Primary button */}
          <button
            onClick={signInWithGoogle}
            className="w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Chrome size={20} />
            Sign in with Google
          </button>
          
          {/* Guest link */}
          <Link
            to="/create"
            className="text-xs text-center cursor-pointer transition-colors duration-200"
            style={{ color: 'var(--color-text-3)' }}
          >
            Continue as guest — no account needed
          </Link>
        </div>
      </div>
    </div>
  )
}
