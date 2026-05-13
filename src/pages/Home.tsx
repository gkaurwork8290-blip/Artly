// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ChevronRight, Sparkles, Clock, CheckCircle2,
  BookOpen, Heart, Lightbulb, Palette, ArrowRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const TODAYS_IDEAS = [
  { title: 'Minimal Watercolour Leaves', desc: 'Soft greens, warm neutrals, and calm botanical detail.', seed: 'watercolour-botanical-leaves-paper' },
  { title: 'Pressed Flower Collage', desc: 'Layer dried petals into a delicate framed composition.', seed: 'pressed-flowers-collage-cream' },
  { title: 'Ink Wash Landscape', desc: 'Explore depth and mood with diluted black ink on wet paper.', seed: 'ink-wash-misty-mountain-fog' },
  { title: 'Abstract Colour Blocking', desc: 'Bold flat shapes, strong contrast, generous negative space.', seed: 'abstract-colour-block-geometric' },
  { title: 'Pencil Still Life Study', desc: 'Pick three objects from your desk and draw from observation.', seed: 'pencil-sketch-still-life-objects' },
  { title: 'Texture Palette Knife Study', desc: 'Build rich surface texture with thick paint and a palette knife.', seed: 'texture-acrylic-impasto-palette' },
  { title: 'Monochrome Portrait', desc: 'One colour, full value range — total focus on form and light.', seed: 'charcoal-monochrome-portrait-study' },
]

function getTodaysIdea() {
  return TODAYS_IDEAS[new Date().getDay()]
}

function getGreeting(firstName?: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return firstName ? `Good ${time}, ${firstName}` : null
}

function picsumSeed(s: string) {
  return encodeURIComponent(s.replace(/\s+/g, '-').toLowerCase())
}

// ─── Guest View ───────────────────────────────────────────────────────────────

function GuestHome({ onGetStarted }: { onGetStarted: () => void }) {
  const navigate = useNavigate()
  const todaysIdea = getTodaysIdea()

  const features = [
    { icon: <Lightbulb size={20} color="#6C3CE1" />, title: 'AI-powered ideas', desc: 'Upload your materials and get 3 personalised project ideas instantly.' },
    { icon: <Palette size={20} color="#FF3D71" />, title: 'Colour palettes', desc: 'Every idea comes with a curated palette and mixing guide.' },
    { icon: <BookOpen size={20} color="#1D9E75" />, title: 'Creative journal', desc: 'Document your work, rate your results, and track your growth.' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 0' }}>

        {/* Top bar */}
        <div style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="artly" style={{ width: 44, height: 44, objectFit: 'contain', mixBlendMode: 'screen' }} />
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(28px,7vw,38px)', fontWeight: 900, color: 'var(--color-text)', margin: '0 0 10px', lineHeight: 1.15 }}>
            Your AI creative<br />
            <span style={{ background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              companion.
            </span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 340 }}>
            Turn your art supplies into inspired projects. Upload your materials, get tailored ideas, and create more with what you have.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onGetStarted}
              style={{ flex: 1, height: 50, background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Get started <ArrowRight size={17} />
            </button>
            <button
              onClick={() => navigate('/create')}
              style={{ height: 50, padding: '0 20px', background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--color-text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Try as guest
            </button>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: 'var(--color-surface)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {f.icon}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 3px' }}>{f.title}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Today's idea */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,61,113,0.15)' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Sparkles size={13} color="var(--color-accent)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's idea</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.3 }}>{todaysIdea.title}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: '0 0 16px', lineHeight: 1.5 }}>{todaysIdea.desc}</p>
              <button
                onClick={() => navigate('/create')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: 'transparent', border: '1.5px solid var(--color-accent)', borderRadius: 10, color: 'var(--color-accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Try this idea <ChevronRight size={13} />
              </button>
            </div>
            <img
              src={`https://picsum.photos/seed/${picsumSeed(todaysIdea.seed)}/200/200`}
              alt={todaysIdea.title}
              style={{ width: 130, minHeight: 160, objectFit: 'cover', flexShrink: 0 }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Signed-in Dashboard ──────────────────────────────────────────────────────

function SignedInHome({ user }: { user: any }) {
  const navigate = useNavigate()
  const [activeIdea, setActiveIdea] = useState<any>(null)
  const [journalEntries, setJournalEntries] = useState<any[]>([])
  const [savedIdeas, setSavedIdeas] = useState<string[]>([])
  const todaysIdea = getTodaysIdea()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? null
  const greeting = getGreeting(firstName)

  useEffect(() => {
    try { const r = localStorage.getItem('artly_active_idea'); if (r) setActiveIdea(JSON.parse(r)) } catch {}
    try { const r = localStorage.getItem('artly_journal_entries'); if (r) setJournalEntries(JSON.parse(r)) } catch {}
    try {
      const ideas: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('artly_saved_') && localStorage.getItem(key) === 'true') ideas.push(key.replace('artly_saved_', ''))
      }
      setSavedIdeas(ideas)
    } catch {}
  }, [])

  const projects = [
    ...journalEntries.map(e => ({ title: e.idea_title || 'Untitled', status: 'completed', image: e.artwork_image || null })),
    ...savedIdeas.filter(t => !journalEntries.find(e => e.idea_title === t)).map(t => ({ title: t, status: 'saved', image: null })),
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 0' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <img src="/logo.png" alt="artly" style={{ width: 44, height: 44, objectFit: 'contain', mixBlendMode: 'screen' }} />
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(24px,6vw,32px)', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.2 }}>
            {greeting || <>Ready to <span style={{ color: 'var(--color-accent)' }}>create</span> today?</>}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>
            Pick up where you left off or start something new.
          </p>
        </div>

        {/* In-progress or prompt */}
        {activeIdea ? (
          <div style={{ background: 'var(--color-surface)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(108,60,225,0.25)', marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate('/project')}>
            <div style={{ display: 'flex' }}>
              <img src={`https://picsum.photos/seed/${picsumSeed(activeIdea.title)}/200/200`} alt={activeIdea.title} style={{ width: 120, height: 140, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(108,60,225,0.15)', borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C3CE1' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6C3CE1' }}>Continue</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.3 }}>{activeIdea.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '0 0 10px' }}>{activeIdea.steps?.length ? `${activeIdea.steps.length} steps` : 'In progress'}</p>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: '100%', width: '40%', borderRadius: 2, background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)' }} />
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); navigate('/project') }} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'transparent', border: '1.5px solid var(--color-accent)', borderRadius: 10, color: 'var(--color-accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
                  Resume <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div onClick={() => navigate('/create')} style={{ background: 'var(--color-surface)', borderRadius: 20, padding: '20px 18px', border: '1px dashed rgba(108,60,225,0.3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
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

        {/* Today's idea */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,61,113,0.15)', marginBottom: 24 }}>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Sparkles size={13} color="var(--color-accent)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's idea</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.3 }}>{todaysIdea.title}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: '0 0 16px', lineHeight: 1.5 }}>{todaysIdea.desc}</p>
              <button onClick={() => navigate('/create')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: 'transparent', border: '1.5px solid var(--color-accent)', borderRadius: 10, color: 'var(--color-accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Try this idea <ChevronRight size={13} />
              </button>
            </div>
            <img src={`https://picsum.photos/seed/${picsumSeed(todaysIdea.seed)}/200/200`} alt={todaysIdea.title} style={{ width: 130, minHeight: 160, objectFit: 'cover', flexShrink: 0 }} />
          </div>
        </div>

        {/* Your Projects */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>Your Projects</span>
            {projects.length > 0 && (
              <button onClick={() => navigate('/saved')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 13, fontWeight: 600 }}>
                View all <ChevronRight size={14} />
              </button>
            )}
          </div>
          {projects.length === 0 ? (
            <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: '28px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
              <BookOpen size={28} color="var(--color-text-3)" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>No projects yet</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: '0 0 14px' }}>Complete a project and journal it to see it here</p>
              <button onClick={() => navigate('/create')} style={{ padding: '9px 20px', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Start creating
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {projects.map((p, i) => (
                <div key={i} onClick={() => navigate(p.status === 'completed' ? '/saved' : '/project')} style={{ flexShrink: 0, width: 160, background: 'var(--color-surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={p.image || `https://picsum.photos/seed/${picsumSeed(p.title)}/320/200`} alt={p.title} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: p.status === 'completed' ? 'rgba(29,158,117,0.9)' : 'rgba(255,61,113,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.status === 'completed' ? <CheckCircle2 size={14} color="#fff" /> : <Heart size={13} color="#fff" fill="#fff" />}
                    </div>
                  </div>
                  <div style={{ padding: '10px 10px 12px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {p.status === 'completed'
                        ? <><CheckCircle2 size={11} color="#1D9E75" /><span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600 }}>Completed</span></>
                        : <><Clock size={11} color="#EF9F27" /><span style={{ fontSize: 11, color: '#EF9F27', fontWeight: 600 }}>Saved</span></>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start something new */}
        <div onClick={() => navigate('/create')} style={{ background: 'var(--color-surface)', borderRadius: 18, padding: '16px 18px', border: '1px dashed rgba(108,60,225,0.3)', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', marginBottom: 8 }}>
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
      <style>{`div::-webkit-scrollbar{display:none;}`}</style>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) return <SignedInHome user={user} />
  return <GuestHome onGetStarted={() => navigate('/onboarding')} />
}
