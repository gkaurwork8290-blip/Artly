// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, SlidersHorizontal, Folder, Lightbulb, BookOpen,
  Heart, MoreVertical, CheckCircle2, Clock, Plus, ImagePlus,
  Smile, SmilePlus, Meh, Frown, Star
} from 'lucide-react'

const MOOD_MAP = {
  proud:      { Icon: SmilePlus, color: '#1D9E75' },
  happy:      { Icon: Smile,     color: '#EF9F27' },
  mixed:      { Icon: Meh,       color: '#6C3CE1' },
  frustrated: { Icon: Frown,     color: '#FF3D71' },
}

function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(108,60,225,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        {icon}
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>{title}</p>
      <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 20px', lineHeight: 1.5 }}>{sub}</p>
      {action && (
        <button onClick={onAction} style={{ padding: '10px 24px', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {action}
        </button>
      )}
    </div>
  )
}

export default function Saved() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('projects')
  const [journalEntries, setJournalEntries] = useState([])
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [savedIdeas, setSavedIdeas] = useState([])

  useEffect(() => {
    // Load journal entries
    try {
      const entries = JSON.parse(localStorage.getItem('artly_journal_entries') || '[]')
      setJournalEntries(entries)
    } catch {}

    // Load saved ideas — scan localStorage for artly_saved_* keys
    try {
      const ideas = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('artly_saved_') && localStorage.getItem(key) === 'true') {
          ideas.push(key.replace('artly_saved_', ''))
        }
      }
      setSavedIdeas(ideas)
    } catch {}
  }, [])

  const tabs = [
    { id: 'projects', label: 'Projects', Icon: Folder },
    { id: 'ideas',    label: 'Ideas',    Icon: Lightbulb },
    { id: 'journal',  label: 'Journal',  Icon: BookOpen },
  ]

  const picsumSeed = (title) => encodeURIComponent((title || 'art').replace(/\s+/g, '-').toLowerCase())

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return '' }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(28px,6vw,36px)', fontWeight: 800, margin: '0 0 4px', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Saved
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>Your ideas and creations, all in one place.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Search size={18} color="var(--color-text-2)" />
            </button>
            <button style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <SlidersHorizontal size={18} color="var(--color-text-2)" />
            </button>
          </div>
        </div>

        {/* ── Tab switcher ── */}
        <div style={{ display: 'flex', background: 'var(--color-surface)', borderRadius: 14, padding: 4, marginBottom: 24, marginTop: 16 }}>
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', borderRadius: 11, background: isActive ? '#6C3CE1' : 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Icon size={15} color={isActive ? '#fff' : 'var(--color-text-3)'} />
                <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : 'var(--color-text-3)' }}>{label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Projects tab ── */}
        {activeTab === 'projects' && (
          <>
            {journalEntries.length === 0 ? (
              <EmptyState
                icon={<Folder size={24} color="#6C3CE1" />}
                title="No projects yet"
                sub="Start a project and journal your result to see it here."
                action="Start creating"
                onAction={() => navigate('/create')}
              />
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Projects</span>
                  <span style={{ fontSize: 12, color: '#6C3CE1', fontWeight: 600 }}>Sort: Recent ↓</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {journalEntries.map((entry, i) => (
                    <div key={i} style={{ background: 'var(--color-surface)', borderRadius: 18, padding: 14, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {/* Thumbnail */}
                      <img
                        src={entry.artwork_image || `https://picsum.photos/seed/${picsumSeed(entry.idea_title)}/120/120`}
                        alt={entry.idea_title}
                        style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                      />
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, lineHeight: 1.3, paddingRight: 8 }}>{entry.idea_title || 'Untitled project'}</p>
                          <Heart size={18} color="#FF3D71" fill="#FF3D71" style={{ flexShrink: 0 }} />
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(29,158,117,0.12)', border: '1px solid #1D9E75', borderRadius: 20, padding: '3px 10px', marginBottom: 6 }}>
                          <CheckCircle2 size={11} color="#1D9E75" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1D9E75' }}>Completed</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '0 0 8px' }}>{formatDate(entry.created_at)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <button
                            onClick={() => {
                              localStorage.setItem('artly_active_idea', JSON.stringify({ title: entry.idea_title, steps: [] }))
                              navigate('/project')
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'transparent', border: '1.5px solid #6C3CE1', borderRadius: 10, color: '#6C3CE1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Open project <span style={{ fontSize: 14 }}>›</span>
                          </button>
                          <MoreVertical size={18} color="var(--color-text-3)" style={{ cursor: 'pointer' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Ideas tab ── */}
        {activeTab === 'ideas' && (
          savedIdeas.length === 0 ? (
            <EmptyState
              icon={<Lightbulb size={24} color="#6C3CE1" />}
              title="No saved ideas yet"
              sub="Heart an idea on the Create screen to save it here."
              action="Explore ideas"
              onAction={() => navigate('/create')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {savedIdeas.map((title, i) => (
                <div key={i} style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img src={`https://picsum.photos/seed/${picsumSeed(title)}/80/80`} alt={title} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
                    <button
                      onClick={() => navigate('/create')}
                      style={{ fontSize: 11, fontWeight: 600, color: '#6C3CE1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Start this project →
                    </button>
                  </div>
                  <Heart size={18} color="#FF3D71" fill="#FF3D71" />
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Journal tab ── */}
        {activeTab === 'journal' && (
          journalEntries.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={24} color="#6C3CE1" />}
              title="No journal entries yet"
              sub="Complete a project and journal your experience to see it here."
              action="Start a project"
              onAction={() => navigate('/create')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {journalEntries.map((entry, i) => {
                const moodData = MOOD_MAP[entry.mood]
                return (
                  <div
                    key={i}
                    onClick={() => setExpandedEntry(entry)}
                    style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>{entry.idea_title || 'Journal entry'}</p>
                        <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>{formatDate(entry.created_at)}</p>
                      </div>
                      {moodData && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${moodData.color}15`, border: `1px solid ${moodData.color}`, borderRadius: 20, padding: '4px 10px' }}>
                          <moodData.Icon size={13} color={moodData.color} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: moodData.color, textTransform: 'capitalize' }}>{entry.mood}</span>
                        </div>
                      )}
                    </div>
                    {entry.rating > 0 && (
                      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={14} color="#EF9F27" fill={n <= entry.rating ? '#EF9F27' : 'transparent'} strokeWidth={1.5} />
                        ))}
                      </div>
                    )}
                    {entry.text && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {entry.text}
                      </p>
                    )}
                    {entry.artwork_image && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#6C3CE1', fontWeight: 600 }}>📷 Photo attached — tap to view</div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── Journal entry detail modal ── */}
        {expandedEntry && (() => {
          const entry = expandedEntry
          const moodData = MOOD_MAP[entry.mood]
          return (
            <div
              onClick={() => setExpandedEntry(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 640, background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', padding: '24px 20px 44px', maxHeight: '90vh', overflowY: 'auto' }}
              >
                {/* Handle */}
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-text-3)', margin: '0 auto 20px' }} />

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 4px' }}>{entry.idea_title || 'Journal entry'}</h3>
                    <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>{formatDate(entry.created_at)}</p>
                  </div>
                  {moodData && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${moodData.color}15`, border: `1px solid ${moodData.color}`, borderRadius: 20, padding: '6px 12px' }}>
                      <moodData.Icon size={15} color={moodData.color} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: moodData.color, textTransform: 'capitalize' }}>{entry.mood}</span>
                    </div>
                  )}
                </div>

                {/* Stars */}
                {entry.rating > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={20} color="#EF9F27" fill={n <= entry.rating ? '#EF9F27' : 'transparent'} strokeWidth={1.5} />
                    ))}
                  </div>
                )}

                {/* Artwork image */}
                {entry.artwork_image && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Your artwork</p>
                    <img src={entry.artwork_image} alt="Artwork" style={{ width: '100%', borderRadius: 14, objectFit: 'cover', maxHeight: 280 }} />
                  </div>
                )}

                {/* Text */}
                {entry.text && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Notes</p>
                    <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{entry.text}</p>
                  </div>
                )}

                <button
                  onClick={() => setExpandedEntry(null)}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          )
        })()}

        {/* ── Start something new ── */}
        <div
          onClick={() => navigate('/create')}
          style={{ marginTop: 24, background: 'var(--color-surface)', borderRadius: 18, padding: '16px 18px', border: '1px dashed rgba(108,60,225,0.3)', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,60,225,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ImagePlus size={22} color="#6C3CE1" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px' }}>Start something new</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0 }}>Create a new idea or project</p>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6C3CE1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={20} color="#fff" />
          </div>
        </div>

      </div>
    </div>
  )
}
