import {} from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lightbulb, Palette, User, Lock } from 'lucide-react'

export default function Landing() {
  const { signInWithGoogle } = useAuth()

  return (
  <div style={{
    minHeight: '100dvh',
    backgroundColor: 'var(--color-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(16px, 4vw, 40px)',
    boxSizing: 'border-box',
  }}>
    <div style={{
      width: '100%',
      maxWidth: '900px',
      background: 'var(--color-surface)',
      borderRadius: '24px',
      border: '1px solid rgba(108, 60, 225, 0.25)',
      boxShadow: '0 0 40px rgba(108, 60, 225, 0.08)',
      padding: 'clamp(24px, 5vw, 48px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
    }}
    className="landing-inner"
    >

      {/* ── BRANDING (always visible) ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        textAlign: 'center',
      }}>
        <img
          src="/logo.png"
          alt="artly logo"
          style={{
            width: 'clamp(80px, 12vw, 120px)',
            height: 'clamp(80px, 12vw, 120px)',
            objectFit: 'contain',
            mixBlendMode: 'screen',
          }}
        />
        <span style={{
          fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: '900',
          color: 'var(--color-text)',
          letterSpacing: '-1px',
        }}>
          artly
        </span>
        <h1 style={{
          fontSize: 'clamp(18px, 4vw, 28px)',
          fontWeight: '800',
          color: 'var(--color-text)',
          textAlign: 'center',
          lineHeight: '1.3',
          margin: '0',
          maxWidth: '480px',
        }}>
          Turn your art supplies into{' '}
          <span style={{ color: 'var(--color-accent)' }}>ideas</span>
          {' '}instantly.
        </h1>
        <p style={{
          fontSize: 'clamp(12px, 2vw, 15px)',
          color: 'var(--color-text-2)',
          textAlign: 'center',
          lineHeight: '1.6',
          margin: '0',
          maxWidth: '360px',
        }}>
          Your AI creative companion to help you create more with what you have.
        </p>
      </div>

      {/* ── TWO COLUMN ON DESKTOP, SINGLE COLUMN ON MOBILE ── */}
      <div className="landing-columns">

        {/* Feature strip */}
        <div style={{
          backgroundColor: 'var(--color-bg)',
          borderRadius: '16px',
          padding: '20px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}>
          {[
            {
              icon: <Lightbulb size={24} color="#6C3CE1" strokeWidth={1.5} />,
              label: '3 Ideas',
              desc: 'Personalized ideas from your materials',
              color: '#6C3CE1',
            },
            {
              icon: <Palette size={24} color="#8B5CF6" strokeWidth={1.5} />,
              label: 'Color Palettes',
              desc: 'Beautiful palettes with mixing guides',
              color: '#8B5CF6',
            },
          ].map((f) => (
            <div key={f.label} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 4px',
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                backgroundColor: 'var(--color-surface)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {f.icon}
              </div>
              <span style={{
                fontSize: 'clamp(11px, 1.5vw, 13px)',
                fontWeight: '700',
                color: f.color,
                textAlign: 'center',
              }}>
                {f.label}
              </span>
              <span style={{
                fontSize: 'clamp(10px, 1.3vw, 12px)',
                color: 'var(--color-text-2)',
                textAlign: 'center',
                lineHeight: '1.4',
              }}>
                {f.desc}
              </span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}>
          <button
            onClick={() => window.location.href = '/create'}
            style={{
              width: '100%',
              height: '52px',
              background: 'linear-gradient(90deg, #6C3CE1 0%, #FF6B35 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontWeight: '700',
              fontSize: 'clamp(14px, 2vw, 16px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '14px',
            }}
          >
            <User size={18} color="white" strokeWidth={2} />
            Continue as Guest
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '14px',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-text-3)', opacity: 0.4 }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-text-3)', opacity: 0.4 }} />
          </div>

          <button
            onClick={signInWithGoogle}
            style={{
              width: '100%',
              height: '52px',
              backgroundColor: 'transparent',
              color: 'var(--color-text)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              fontWeight: '600',
              fontSize: 'clamp(13px, 2vw, 15px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}>
            <Lock size={12} color="var(--color-text-3)" strokeWidth={2} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
              Your creativity, your space.
            </span>
          </div>
        </div>

      </div>
    </div>

    {/* Responsive styles */}
    <style>{`
      .landing-columns {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      @media (min-width: 768px) {
        .landing-columns {
          flex-direction: row;
          align-items: stretch;
          gap: 40px;
        }
        .landing-columns > div {
          flex: 1;
        }
      }
    `}</style>

  </div>
)
}
