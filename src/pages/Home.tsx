// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ChevronRight, Sparkles, Clock, CheckCircle2,
  BookOpen, Heart
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// ─── Today's Idea — 7 static art ideas rotated by day of week ────────────────

const TODAYS_IDEAS = [
  {
    title: 'Minimal Watercolour Leaves',
    desc: 'Soft greens, warm neutrals, and calm details.',
    seed: 'watercolour-leaves-botanical',
  },
  {
    title: 'Pressed Flower Collage',
    desc: 'Layer dried petals into a delicate composition.',
    seed: 'pressed-flowers-paper-texture',
  },
  {
    title: 'Ink Wash Landscape',
    desc: 'Explore depth and mood with diluted black ink.',
    seed: 'ink-wash-misty-mountains',
  },
  {
    title: 'Abstract Colour Blocking',
    desc: 'Bold shapes, flat colour, and negative space.',
    seed: 'abstract-colour-blocks-canvas',
  },
  {
    title: 'Sketched Still Life',
    desc: 'Pick three objects and draw from observation.',
    seed: 'pencil-sketch-still-life',
  },
  {
    title: 'Texture Paste Experiment',
    desc: 'Build surface with palette knife and thick paint.',
    seed: 'texture-acrylic-palette-knife',
  },
  {
    title: 'Monochrome Portrait Study',
    desc: 'One colour, full range of value, total focus.',
    seed: 'monochrome-portrait-charcoal',
  },
]

function getTodaysIdea() {
  return TODAYS_IDEAS[new Date().getDay()]
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(firstName?: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return firstName ? `Good ${time}, ${firstName}` : `Ready to create today?`
}

function getGreetingSub(firstName?: string) {
  return firstName
    ? 'Pick up where you left off or start something new.'
    : 'Pick up where you left off\nor start something new.'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function picsumSeed(s: string) {
  return encodeURIComponent(s.replace(/\s+/g, '-').toLowerCase())
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [activeIdea, setActiveIdea] = useState<any>(null)
  const [journalEntries, setJournalEntries] = useState<any[]>([])
  const [savedIdeas, setSavedIdeas] = useState<string[]>([])
  const todaysIdea = getTodaysIdea()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? null

  useEffect(() => {
    // Active idea
    try {
      const raw = localStorage.getItem('artly_active_idea')
      if (raw) setActiveIdea(JSON.parse(raw))
    } catch {}

    // Journal entries
    try {
      const raw = localStorage.getItem('artly_journal_entries')
      if (raw) setJournalEntries(JSON.parse(raw))
    } catch {}

    // Saved ideas
    try {
      const ideas: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('artly_saved_') && localStorage.getItem(key) === 'true') {
          ideas.push(key.replace('artly_saved_', ''))
        }
      }
      setSavedIdeas(ideas)
    } catch {}
  }, [])

  // Combine journal + saved into "projects" list for the grid
  const projects = [
    ...journalEntries.map(e => ({
      title: e.idea_title || 'Untitled',
      status: 'completed',
      image: e.artwork_image || null,
      date: e.created_at,
    })),
    ...savedIdeas
      .filter(t => !journalEntries.find(e => e.idea_title === t))
      .map(t => ({
        title: t,
        status: 'saved',
        image: null,
        date: null,
      })),
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 0' }}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <img
            src="/logo.png"
            alt="artly"
            style={{ width: 36, height: 36, objectFit: 'contain', mixBlendMode: 'screen' }}
          />
          {/* Notification bell — Phase 2 */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
        </div>

        {/* ── Greeting ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.2 }}>
            {getGreeting(firstName).split('create').map((part, i, arr) =>
              i < arr.length - 1
                ? <span key={i}>{part}<span style={{ color: 'var(--color-accent)' }}>create</span></span>
                : <span key={i}>{part}</span>
            )}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {getGreetingSub(firstName)}
          </p>
        </div>

        {/* ── In-progress card ── */}
        {activeIdea ? (
          <div
            style={{ background: 'var(--color-surface)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(108,60,225,0.25)', marginBottom: 20, cursor: 'pointer' }}
            onClick={() => navigate('/project')}
          >
            <div style={{ display: 'flex', gap: 0 }}>
              {/* Image */}
              <img
                src={`https://picsum.photos/seed/${picsumSeed(activeIdea.title)}/200/200`}
                alt={activeIdea.title}
                style={{ width: 120, height: 140, objectFit: 'cover', flexShrink: 0 }}
              />
              {/* Content */}
              <div style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(108,60,225,0.15)', borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C3CE1' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6C3CE1' }}>Continue</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.3 }}>
                    {activeIdea.title}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '0 0 10px' }}>
                    {activeIdea.steps?.length ? `${activeIdea.steps.length} steps` : 'In progress'}
                  </p>
                  {/* Progress bar */}
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: '40%', borderRadius: 2, background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)' }} />
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); navigate('/project') }}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'transparent', border: '1.5px solid var(--color-accent)', borderRadius: 10, color: 'var(--color-accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
                >
                  Resume <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => navigate('/create')}
            style={{ background: 'var(--color-surface)', borderRadius: 20, padding: '20px 18px', border: '1px dashed rgba(108,60,225,0.3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(108,60,225,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={22} color="#6C3CE1" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 3px' }}>Start your first project</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0 }}>Upload your materials and get ideas instantly</p>
            </div>
            <ChevronRight size={18} color="var(--color-text-3)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        )}

        {/* ── Today's idea ── */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,61,113,0.15)', marginBottom: 24 }}>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Sparkles size={13} color="var(--color-accent)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's idea</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.3 }}>
                {todaysIdea.title}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: '0 0 16px', lineHeight: 1.5 }}>
                {todaysIdea.desc}
              </p>
              <button
                onClick={() => navigate('/create')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: 'transparent', border: '1.5px solid var(--color-accent)', borderRadius: 10, color: 'var(--color-accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Explore idea <ChevronRight size={13} />
              </button>
            </div>
            <img
              src={`https://picsum.photos/seed/${picsumSeed(todaysIdea.seed)}/200/200`}
              alt={todaysIdea.title}
              style={{ width: 130, height: '100%', minHeight: 160, objectFit: 'cover', flexShrink: 0 }}
            />
          </div>
        </div>

        {/* ── Your Projects ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>Your Projects</span>
            {projects.length > 0 && (
              <button
                onClick={() => navigate('/saved')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 13, fontWeight: 600 }}
              >
                View all <ChevronRight size={14} />
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: '28px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
              <BookOpen size={28} color="var(--color-text-3)" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>No projects yet</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: '0 0 14px' }}>Complete a project and journal it to see it here</p>
              <button
                onClick={() => navigate('/create')}
                style={{ padding: '9px 20px', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Start creating
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {projects.map((p, i) => (
                <div
                  key={i}
                  onClick={() => navigate(p.status === 'completed' ? '/saved' : '/project')}
                  style={{ flexShrink: 0, width: 160, background: 'var(--color-surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={p.image || `https://picsum.photos/seed/${picsumSeed(p.title)}/320/200`}
                      alt={p.title}
                      style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                    />
                    {p.status === 'completed' && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(29,158,117,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={14} color="#fff" />
                      </div>
                    )}
                    {p.status === 'saved' && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,61,113,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart size={13} color="#fff" fill="#fff" />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px 10px 12px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.title}
                    </p>
                    {p.status === 'completed' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} color="#1D9E75" />
                        <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600 }}>Completed</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} color="#EF9F27" />
                        <span style={{ fontSize: 11, color: '#EF9F27', fontWeight: 600 }}>Saved</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Start something new ── */}
        <div
          onClick={() => navigate('/create')}
          style={{ background: 'var(--color-surface)', borderRadius: 18, padding: '16px 18px', border: '1px dashed rgba(108,60,225,0.3)', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', marginBottom: 8 }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,60,225,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={22} color="#6C3CE1" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px' }}>Start something new</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0 }}>Create a new idea or project</p>
          </div>
          <ChevronRight size={18} color="var(--color-text-3)" />
        </div>

      </div>

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
