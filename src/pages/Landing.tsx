import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Chrome } from 'lucide-react'

export default function Landing() {
  const { signInWithGoogle } = useAuth()

  return (
    <div 
      className="flex flex-col items-center justify-between" 
      style={{ 
        backgroundColor: 'var(--color-bg)', 
        minHeight: '100vh',
        maxWidth: '400px',
        margin: '0 auto',
        padding: '48px 24px'
      }}
    >
      {/* TOP SECTION */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* 48×48 rounded square with A */}
        <div 
          className="w-12 h-12 flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--color-primary)', 
            borderRadius: '12px' 
          }}
        >
          <span className="text-2xl font-black text-white">A</span>
        </div>
        
        {/* artly wordmark */}
        <h1 
          className="text-2xl font-black"
          style={{ 
            color: 'var(--color-text)', 
            marginTop: '8px' 
          }}
        >
          artly
        </h1>
        
        {/* Tagline */}
        <p 
          className="text-sm text-center"
          style={{ 
            color: 'var(--color-text-2)', 
            maxWidth: '280px' 
          }}
        >
          Your AI creative companion. Make art with what you have.
        </p>
      </div>

      {/* BOTTOM SECTION */}
      <div className="w-full flex flex-col gap-3" style={{ paddingBottom: '32px' }}>
        {/* Primary button */}
        <button
          onClick={signInWithGoogle}
          className="w-full font-semibold text-white flex items-center justify-center gap-2"
          style={{ 
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-primary)',
            fontSize: '14px'
          }}
        >
          <Chrome size={16} />
          Sign in with Google
        </button>
        
        {/* Guest link */}
        <Link
          to="/create"
          className="text-xs text-center cursor-pointer"
          style={{ color: 'var(--color-text-3)' }}
        >
          Continue as guest — no account needed
        </Link>
      </div>
    </div>
  )
}
