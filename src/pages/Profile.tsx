import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Moon, Sun, Bell, BellOff, ChevronRight,
  LogOut, LogIn, BookOpen, Layers, Star, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../lib/analytics';

const SKILL_LEVELS = ['Beginner', 'Hobbyist', 'Intermediate', 'Advanced', 'Professional'];

function getStats() {
  const journalRaw = localStorage.getItem('artly_journal_entries');
  const journal: unknown[] = journalRaw ? JSON.parse(journalRaw) : [];
  const savedCount = Object.keys(localStorage).filter(k => k.startsWith('artly_saved_')).length;
  const sessions = journal.length > 0 ? Math.max(journal.length, 1) : 0;
  return { sessions, saved: savedCount, journal: journal.length };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [skill, setSkill] = useState('Beginner');
  const [notifications, setNotifications] = useState(false);
  const [language] = useState<string>('English');
  const [showSkillSheet, setShowSkillSheet] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const stats = getStats();

  useEffect(() => {
    const t = localStorage.getItem('artly_theme');
    if (t === 'light' || t === 'dark') setTheme(t);
    const s = localStorage.getItem('artly_skill');
    if (s) setSkill(s);
    const n = localStorage.getItem('artly_notifications');
    if (n === 'true') setNotifications(true);
  }, []);

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('theme-light');
    else document.body.classList.remove('theme-light');
    localStorage.setItem('artly_theme', theme);
  }, [theme]);

  function handleThemeChange(newTheme: 'dark' | 'light') {
    setTheme(newTheme);
    Analytics.themeChanged(newTheme);
  }

  function handleSkillSelect(s: string) {
    setSkill(s);
    localStorage.setItem('artly_skill', s);
    Analytics.skillLevelChanged(s);
    setShowSkillSheet(false);
  }

  function handleNotificationsToggle() {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('artly_notifications', String(next));
  }

  async function handleSignOut() {
    Analytics.signedOut();
    await signOut();
    setShowSignOutConfirm(false);
    navigate('/');
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Guest';
  const displayEmail = user?.email ?? null;
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  return (
    <div className="profile-page" style={{ paddingBottom: 96 }}>

      {/* ── Logo top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 0' }}>
        <img src="/logo.png" alt="artly" style={{ width: 36, height: 36, objectFit: 'contain', mixBlendMode: 'screen' }} />
        <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>artly</span>
      </div>

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-initials">
              {user ? initials : <User size={28} color="var(--color-text-2)" />}
            </div>
          )}
        </div>

        {user ? (
          <>
            <h1 className="profile-name">{displayName}</h1>
            {displayEmail && <p className="profile-email">{displayEmail}</p>}
            <div className="profile-stats-row">
              <div className="profile-stat">
                <span className="profile-stat-value">{stats.sessions}</span>
                <span className="profile-stat-label">Sessions</span>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <span className="profile-stat-value">{stats.saved}</span>
                <span className="profile-stat-label">Saved</span>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <span className="profile-stat-value">{stats.journal}</span>
                <span className="profile-stat-label">Journal</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="profile-name">Guest</h1>
            <p className="profile-email-sub">Sign in to save your work</p>
            <button className="profile-signin-card" onClick={() => navigate('/')}>
              <LogIn size={18} color="var(--color-primary)" />
              <span>Sign in or create account</span>
              <ChevronRight size={16} color="var(--color-text-2)" />
            </button>
          </>
        )}
      </div>

      {/* ── Appearance ── */}
      <section className="profile-section">
        <h2 className="profile-section-title">Appearance</h2>
        <div className="profile-row">
          <div className="profile-row-left">
            {theme === 'dark' ? <Moon size={18} color="var(--color-primary)" /> : <Sun size={18} color="var(--color-warning)" />}
            <span className="profile-row-label">Theme</span>
          </div>
          <div className="theme-toggle-pill">
            <button className={`theme-pill-btn${theme === 'dark' ? ' active' : ''}`} onClick={() => handleThemeChange('dark')}>Artisan Dark</button>
            <button className={`theme-pill-btn${theme === 'light' ? ' active' : ''}`} onClick={() => handleThemeChange('light')}>Studio Light</button>
          </div>
        </div>
      </section>

      {/* ── Preferences ── */}
      <section className="profile-section">
        <h2 className="profile-section-title">Preferences</h2>
        <button className="profile-row profile-row-btn" onClick={() => setShowSkillSheet(true)}>
          <div className="profile-row-left">
            <Star size={18} color="var(--color-warning)" />
            <span className="profile-row-label">Skill Level</span>
          </div>
          <div className="profile-row-right">
            <span className="profile-row-value">{skill}</span>
            <ChevronRight size={16} color="var(--color-text-2)" />
          </div>
        </button>
        <div className="profile-row">
          <div className="profile-row-left">
            {notifications ? <Bell size={18} color="var(--color-success)" /> : <BellOff size={18} color="var(--color-text-2)" />}
            <span className="profile-row-label">Notifications</span>
          </div>
          <button className={`toggle-switch${notifications ? ' on' : ''}`} onClick={handleNotificationsToggle} aria-label="Toggle notifications">
            <span className="toggle-knob" />
          </button>
        </div>
        <div className="profile-row">
          <div className="profile-row-left">
            <BookOpen size={18} color="var(--color-text-2)" />
            <span className="profile-row-label">Language</span>
          </div>
          <div className="profile-row-right">
            <span className="profile-row-value">{language}</span>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="profile-section">
        <h2 className="profile-section-title">About</h2>
        <div className="profile-row">
          <div className="profile-row-left">
            <Layers size={18} color="var(--color-text-2)" />
            <span className="profile-row-label">Version</span>
          </div>
          <div className="profile-row-right">
            <span className="profile-row-value">1.0.0-beta</span>
          </div>
        </div>
      </section>

      {/* ── Sign out ── */}
      {user && (
        <section className="profile-section">
          <button className="profile-signout-btn" onClick={() => setShowSignOutConfirm(true)}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </section>
      )}

      {/* ── Skill sheet ── */}
      {showSkillSheet && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowSkillSheet(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-header">
              <h3 className="bottom-sheet-title">Skill Level</h3>
              <button className="bottom-sheet-close" onClick={() => setShowSkillSheet(false)}><X size={20} color="var(--color-text-2)" /></button>
            </div>
            <div className="bottom-sheet-options">
              {SKILL_LEVELS.map(s => (
                <button key={s} className={`skill-option${skill === s ? ' selected' : ''}`} onClick={() => handleSkillSelect(s)}>
                  <span>{s}</span>
                  {skill === s && <span className="skill-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sign out confirm ── */}
      {showSignOutConfirm && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowSignOutConfirm(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-header">
              <h3 className="bottom-sheet-title">Sign Out?</h3>
              <button className="bottom-sheet-close" onClick={() => setShowSignOutConfirm(false)}><X size={20} color="var(--color-text-2)" /></button>
            </div>
            <p className="bottom-sheet-body">Your saved ideas and journal entries are stored locally and won't be lost.</p>
            <div className="bottom-sheet-actions">
              <button className="sheet-btn-secondary" onClick={() => setShowSignOutConfirm(false)}>Cancel</button>
              <button className="sheet-btn-danger" onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-page { min-height: 100vh; background: var(--color-bg); color: var(--color-text); max-width: 480px; margin: 0 auto; padding: 0 0 96px; }
        .profile-header { display: flex; flex-direction: column; align-items: center; padding: 24px 24px 28px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .theme-light .profile-header { border-bottom-color: rgba(0,0,0,0.08); }
        .profile-avatar-wrap { margin-bottom: 14px; }
        .profile-avatar-img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary); }
        .profile-avatar-initials { width: 72px; height: 72px; border-radius: 50%; background: var(--color-surface); border: 2px solid var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: var(--fs-h1); font-weight: 700; color: var(--color-primary); }
        .profile-name { font-size: var(--fs-h1); font-weight: 700; color: var(--color-text); margin: 0 0 4px; }
        .profile-email { font-size: var(--fs-caption); color: var(--color-text-2); margin: 0 0 20px; }
        .profile-email-sub { font-size: var(--fs-caption); color: var(--color-text-2); margin: 4px 0 16px; }
        .profile-stats-row { display: flex; align-items: center; background: var(--color-surface); border-radius: 14px; padding: 14px 24px; min-width: 240px; }
        .profile-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .profile-stat-value { font-size: var(--fs-h1); font-weight: 700; color: var(--color-text); }
        .profile-stat-label { font-size: var(--fs-micro); color: var(--color-text-2); text-transform: uppercase; letter-spacing: 0.6px; }
        .profile-stat-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.1); }
        .theme-light .profile-stat-divider { background: rgba(0,0,0,0.1); }
        .profile-signin-card { display: flex; align-items: center; gap: 12px; background: var(--color-surface); border: 1px solid rgba(108,60,225,0.3); border-radius: 14px; padding: 14px 18px; width: 100%; max-width: 320px; cursor: pointer; font-size: var(--fs-body); color: var(--color-text); margin-top: 4px; }
        .profile-signin-card span { flex: 1; text-align: left; }
        .profile-section { padding: 20px 20px 0; }
        .profile-section-title { font-size: var(--fs-caption); font-weight: 600; color: var(--color-text-2); text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 10px 4px; }
        .profile-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--color-surface); border-radius: 12px; margin-bottom: 8px; border: none; width: 100%; cursor: default; color: var(--color-text); }
        .profile-row-btn { cursor: pointer; text-align: left; }
        .profile-row-left { display: flex; align-items: center; gap: 10px; }
        .profile-row-right { display: flex; align-items: center; gap: 6px; }
        .profile-row-label { font-size: var(--fs-body); color: var(--color-text); }
        .profile-row-value { font-size: var(--fs-body); color: var(--color-text-2); }
        .theme-toggle-pill { display: flex; background: var(--color-bg); border-radius: 10px; padding: 3px; gap: 2px; }
        .theme-pill-btn { padding: 5px 10px; border-radius: 8px; font-size: var(--fs-caption); font-weight: 500; color: var(--color-text-2); background: transparent; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .theme-pill-btn.active { background: var(--color-primary); color: #fff; }
        .toggle-switch { width: 44px; height: 24px; border-radius: 12px; background: var(--color-text-3); border: none; cursor: pointer; position: relative; transition: background 0.25s; flex-shrink: 0; }
        .toggle-switch.on { background: var(--color-success); }
        .toggle-knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.25s; display: block; }
        .toggle-switch.on .toggle-knob { transform: translateX(20px); }
        .profile-signout-btn { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: rgba(255,61,113,0.08); border: 1px solid rgba(255,61,113,0.2); border-radius: 12px; color: var(--color-accent); font-size: var(--fs-body); cursor: pointer; width: 100%; margin-bottom: 8px; }
        .bottom-sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
        .bottom-sheet { background: var(--color-surface); border-radius: 20px 20px 0 0; padding: 12px 20px 40px; width: 100%; max-width: 480px; animation: slideUp 0.25s ease; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .bottom-sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: var(--color-text-3); margin: 0 auto 16px; }
        .bottom-sheet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .bottom-sheet-title { font-size: var(--fs-h2); font-weight: 700; color: var(--color-text); margin: 0; }
        .bottom-sheet-close { background: none; border: none; cursor: pointer; padding: 4px; }
        .bottom-sheet-body { font-size: var(--fs-body); color: var(--color-text-2); margin: 0 0 20px; line-height: 1.5; }
        .bottom-sheet-options { display: flex; flex-direction: column; gap: 8px; }
        .skill-option { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--color-bg); border: 1px solid transparent; border-radius: 12px; font-size: var(--fs-body); color: var(--color-text); cursor: pointer; }
        .skill-option.selected { border-color: var(--color-primary); color: var(--color-primary); }
        .skill-check { color: var(--color-primary); font-weight: 700; }
        .bottom-sheet-actions { display: flex; gap: 10px; margin-top: 8px; }
        .sheet-btn-secondary { flex: 1; padding: 13px; border-radius: 12px; background: var(--color-bg); border: 1px solid rgba(255,255,255,0.1); color: var(--color-text-2); font-size: var(--fs-body); cursor: pointer; }
        .sheet-btn-danger { flex: 1; padding: 13px; border-radius: 12px; background: var(--color-accent); border: none; color: #fff; font-size: var(--fs-body); font-weight: 600; cursor: pointer; }
      `}</style>
    </div>
  );
}
