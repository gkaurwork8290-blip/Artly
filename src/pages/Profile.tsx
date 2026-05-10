// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings, Heart, BookOpen, Moon, Sun,
  GraduationCap, Bell, Globe, LogOut, ChevronRight,
  Edit2, Check, User, Sparkles
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

function StatCard({ icon, value, label, sub, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--color-bg)', borderRadius: 16, padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 10, color: 'var(--color-text-3)', margin: 0 }}>{sub}</p>
    </div>
  )
}

function SettingRow({ icon, label, value, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 10, background: danger ? 'rgba(255,61,113,0.1)' : 'rgba(108,60,225,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: danger ? '#FF3D71' : 'var(--color-text)' }}>{label}</span>
      {value && <span style={{ fontSize: 13, color: '#6C3CE1', fontWeight: 600, marginRight: 4 }}>{value}</span>}
      <ChevronRight size={16} color={danger ? '#FF3D71' : 'var(--color-text-3)'} />
    </button>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut, signInWithGoogle } = useAuth()

  const [theme, setTheme] = useState('dark')
  const [skillLevel, setSkillLevel] = useState('Beginner')
  const [showSkillPicker, setShowSkillPicker] = useState(false)
  const [stats, setStats] = useState({ sessions: 0, saved: 0, journal: 0 })

  useEffect(() => {
    const savedTheme = localStorage.getItem('artly_theme') || 'dark'
    setTheme(savedTheme)

    const skill = localStorage.getItem('artly_skill') || 'beginner'
    setSkillLevel(skill.charAt(0).toUpperCase() + skill.slice(1))

    try {
      const journal = JSON.parse(localStorage.getItem('artly_journal_entries') || '[]')
      const savedCount = Object.keys(localStorage).filter(k => k.startsWith('artly_saved_') && localStorage.getItem(k) === 'true').length
      setStats({ sessions: journal.length, saved: savedCount, journal: journal.length })
    } catch {}
  }, [])

  const applyTheme = (t) => {
    setTheme(t)
    localStorage.setItem('artly_theme', t)
    if (t === 'light') document.body.classList.add('theme-light')
    else document.body.classList.remove('theme-light')
  }

  const handleSkillChange = (level) => {
    setSkillLevel(level)
    localStorage.setItem('artly_skill', level.toLowerCase())
    setShowSkillPicker(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'G'
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest'
  const avatarUrl = user?.user_metadata?.avatar_url

  // ── Guest state ──
  if (!user) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 100 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 24px' }}>Profile</h1>

          {/* Sign in card */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: '32px 20px', textAlign: 'center', marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(108,60,225,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <User size={32} color="#6C3CE1" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>You're browsing as a guest</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 24px', lineHeight: 1.6 }}>Sign in to save your progress and sync across devices.</p>
            <button onClick={signInWithGoogle} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#6C3CE1,#FF3D71)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <AppearanceSection theme={theme} applyTheme={applyTheme} />
          <SkillSection skillLevel={skillLevel} showSkillPicker={showSkillPicker} setShowSkillPicker={setShowSkillPicker} handleSkillChange={handleSkillChange} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Profile</h1>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} color="var(--color-text-2)" />
          </div>
        </div>

        {/* User card */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: '20px 16px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 4 }}>
            {/* Avatar */}
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#6C3CE1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{initials}</span>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 2px' }}>{displayName}</h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 6px' }}>{skillLevel} artist</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0, lineHeight: 1.5 }}>Exploring colours, textures and creating through art.</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#6C3CE1', fontSize: 13, fontWeight: 600 }}>
              <Edit2 size={13} color="#6C3CE1" /> Edit
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <StatCard icon={<Sparkles size={18} color="#6C3CE1" />} value={stats.sessions} label="Sessions" sub="Keep creating!" color="#6C3CE1" />
          <StatCard icon={<Heart size={18} color="#FF3D71" />} value={stats.saved} label="Saved" sub="Your favorites" color="#FF3D71" />
          <StatCard icon={<BookOpen size={18} color="#1D9E75" />} value={stats.journal} label="Journal entries" sub="Keep reflecting" color="#1D9E75" />
        </div>

        {/* Appearance */}
        <AppearanceSection theme={theme} applyTheme={applyTheme} />

        {/* Settings */}
        <SkillSection skillLevel={skillLevel} showSkillPicker={showSkillPicker} setShowSkillPicker={setShowSkillPicker} handleSkillChange={handleSkillChange} />

        {/* Sign out */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
          <SettingRow
            icon={<LogOut size={16} color="#FF3D71" />}
            label="Sign out"
            danger
            onClick={handleSignOut}
          />
        </div>

      </div>

      {/* Skill picker sheet */}
      {showSkillPicker && (
        <div onClick={() => setShowSkillPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', padding: '24px 20px 44px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-text-3)', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 16px' }}>Select skill level</h3>
            {SKILL_LEVELS.map(level => (
              <button key={level} onClick={() => handleSkillChange(level)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: skillLevel === level ? 'rgba(108,60,225,0.1)' : 'transparent', border: `1px solid ${skillLevel === level ? '#6C3CE1' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, marginBottom: 8, cursor: 'pointer' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: skillLevel === level ? '#6C3CE1' : 'var(--color-text)' }}>{level}</span>
                {skillLevel === level && <Check size={16} color="#6C3CE1" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AppearanceSection({ theme, applyTheme }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px' }}>Appearance</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Artisan Dark */}
        <button
          onClick={() => applyTheme('dark')}
          style={{ background: '#0F0F1A', border: `2px solid ${theme === 'dark' ? '#6C3CE1' : 'rgba(255,255,255,0.08)'}`, borderRadius: 18, padding: '20px 16px', cursor: 'pointer', position: 'relative', textAlign: 'left' }}
        >
          {theme === 'dark' && (
            <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: '#6C3CE1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={13} color="#fff" />
            </div>
          )}
          <Moon size={28} color="#6C3CE1" style={{ marginBottom: 10, display: 'block' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Artisan Dark</p>
          <p style={{ fontSize: 11, color: '#A0A0C0', margin: 0 }}>Dark theme</p>
        </button>

        {/* Studio Light */}
        <button
          onClick={() => applyTheme('light')}
          style={{ background: '#EDE5D8', border: `2px solid ${theme === 'light' ? '#B05E3A' : 'rgba(0,0,0,0.08)'}`, borderRadius: 18, padding: '20px 16px', cursor: 'pointer', position: 'relative', textAlign: 'left' }}
        >
          {theme === 'light' && (
            <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: '#B05E3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={13} color="#fff" />
            </div>
          )}
          <Sun size={28} color="#B07820" style={{ marginBottom: 10, display: 'block' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1209', margin: '0 0 3px' }}>Studio Light</p>
          <p style={{ fontSize: 11, color: '#6A5240', margin: 0 }}>Light theme</p>
        </button>
      </div>
    </div>
  )
}

function SkillSection({ skillLevel, showSkillPicker, setShowSkillPicker, handleSkillChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px' }}>Settings</h2>
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setShowSkillPicker(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(108,60,225,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={16} color="#6C3CE1" />
          </div>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-text)', textAlign: 'left' }}>Skill level</span>
          <span style={{ fontSize: 13, color: '#6C3CE1', fontWeight: 600 }}>{skillLevel}</span>
          <ChevronRight size={16} color="var(--color-text-3)" />
        </button>
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(108,60,225,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={16} color="#6C3CE1" />
          </div>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-text)', textAlign: 'left' }}>Notifications</span>
          <span style={{ fontSize: 13, color: '#6C3CE1', fontWeight: 600 }}>On</span>
          <ChevronRight size={16} color="var(--color-text-3)" />
        </button>
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(108,60,225,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={16} color="#6C3CE1" />
          </div>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-text)', textAlign: 'left' }}>Language</span>
          <span style={{ fontSize: 13, color: '#6C3CE1', fontWeight: 600 }}>English</span>
          <ChevronRight size={16} color="var(--color-text-3)" />
        </button>
      </div>
    </div>
  )
}
