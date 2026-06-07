// @ts-nocheck
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Smile, SmilePlus, Meh, Frown, ImagePlus, Camera,
  Sparkles, Star, Check, BookOpen
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Analytics } from '../lib/analytics'

const MOODS = [
  { id: 'proud',      label: 'Proud',      Icon: SmilePlus, color: '#1D9E75', bg: 'rgba(29,158,117,0.12)',  border: '#1D9E75' },
  { id: 'happy',      label: 'Happy',      Icon: Smile,     color: '#EF9F27', bg: 'rgba(239,159,39,0.12)',  border: '#EF9F27' },
  { id: 'mixed',      label: 'Mixed',      Icon: Meh,       color: '#6C3CE1', bg: 'rgba(108,60,225,0.12)',  border: '#6C3CE1' },
  { id: 'frustrated', label: 'Frustrated', Icon: Frown,     color: '#FF3D71', bg: 'rgba(255,61,113,0.12)',  border: '#FF3D71' },
]

const PROMPTS = [
  'What worked well?',
  'What surprised me?',
  "Next time I'd...",
  'The hardest part',
  'What I learned',
]

export default function Journal() {
  const navigate = useNavigate()
  const { user, signInWithGoogle } = useAuth()
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [mood, setMood] = useState(null)
  const [artworkImage, setArtworkImage] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [text, setText] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showNudge, setShowNudge] = useState(false)
  const [activeIdea, setActiveIdea] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('artly_active_idea')
      if (stored) setActiveIdea(JSON.parse(stored))
    } catch {}
    Analytics.journalOpened(
      (() => { try { return JSON.parse(localStorage.getItem('artly_active_idea') || '{}').title || '' } catch { return '' } })()
    )
  }, [])

  const hasContent = mood || text.trim() || rating > 0

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setShowCamera(true)
    } catch { alert('Camera access denied.') }
  }
  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    setArtworkImage(canvas.toDataURL('image/jpeg'))
    stopCamera()
  }
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setShowCamera(false)
  }
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setArtworkImage(ev.target?.result)
    reader.readAsDataURL(file)
  }
  const appendPrompt = (prompt) => {
    const prefix = text.trim() ? text.trimEnd() + '\n' : ''
    setText(prefix + prompt + ' ')
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(9999, 9999)
      }
    }, 50)
  }

  const handleSave = async () => {
    if (!hasContent) return
    setSaving(true)
    Analytics.journalSaved(mood || 'none', rating, !!artworkImage)
    const entry = {
      mood, text: text.trim(), rating,
      idea_title: activeIdea?.title || null,
      artwork_image: artworkImage || null,
      created_at: new Date().toISOString(),
    }
    try {
      const existing = JSON.parse(localStorage.getItem('artly_journal_entries') || '[]')
      localStorage.setItem('artly_journal_entries', JSON.stringify([entry, ...existing]))
      if (!user) {
        setShowNudge(true)
      } else {
        setSaved(true)
        setTimeout(() => navigate('/saved'), 1200)
      }
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#1D9E75,#6C3CE1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={30} color="#fff" />
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Entry saved!</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-2)' }}>Taking you to your saved ideas...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ height: 4, borderRadius: 2, background: '#6C3CE1', width: i === 2 ? 16 : 24 }} />
          ))}
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(28px,6vw,36px)', fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Journal</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0 }}>Capture your experience and reflect on your creation.</p>
          {activeIdea && (
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(108,60,225,0.1)', border: '1px solid rgba(108,60,225,0.2)', borderRadius: 20, padding: '4px 12px' }}>
              <Sparkles size={11} color="#9b7ff0" />
              <span style={{ fontSize: 12, color: '#9b7ff0' }}>{activeIdea.title}</span>
            </div>
          )}
        </div>

        {/* Mood picker */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>How did it feel?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {MOODS.map(({ id, label, Icon, color, bg, border }) => {
              const isSelected = mood === id
              return (
                <button key={id} onClick={() => setMood(isSelected ? null : id)} style={{ background: isSelected ? bg : 'var(--color-surface)', border: `1.5px solid ${isSelected ? border : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '16px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Icon size={28} color={isSelected ? color : 'var(--color-text-3)'} strokeWidth={1.5} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? color : 'var(--color-text-2)' }}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Add artwork */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Add your artwork</p>
          {showCamera ? (
            <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 16 }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={stopCamera} style={{ flex: 1, height: 44, background: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'var(--color-text-2)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button onClick={capturePhoto} style={{ flex: 2, height: 44, background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Capture</button>
              </div>
            </div>
          ) : artworkImage ? (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
              <img src={artworkImage} alt="Artwork" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block', borderRadius: 16 }} />
              <button onClick={() => setArtworkImage(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          ) : (
            <div style={{ border: '1.5px dashed rgba(108,60,225,0.3)', borderRadius: 16, padding: 16, background: 'rgba(108,60,225,0.04)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,60,225,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImagePlus size={22} color="#6C3CE1" /></div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 3px' }}>Upload from gallery</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>Choose from your photos</p>
                  </div>
                </button>
                <button onClick={startCamera} style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,61,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={22} color="#FF3D71" /></div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 3px' }}>Take a photo</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>Use your camera</p>
                  </div>
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Sparkles size={13} color="var(--color-text-3)" />
                <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Add a clear photo of your finished artwork</span>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>

        {/* Writing prompts */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Writing prompts — tap to add</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {PROMPTS.map(prompt => (
              <button key={prompt} onClick={() => appendPrompt(prompt)} style={{ padding: '7px 14px', background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, fontSize: 13, color: 'var(--color-text-2)', cursor: 'pointer' }}>{prompt}</button>
            ))}
          </div>
          <div style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
            <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value.slice(0, 500))} placeholder="Write anything — what you noticed, what you'd do differently..." style={{ width: '100%', minHeight: 120, background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-text-3)', marginTop: 4 }}>{text.length}/500</div>
          </div>
        </div>

        {/* Star rating */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Rate this session</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <Star size={32} color="#EF9F27" fill={n <= (hoverRating || rating) ? '#EF9F27' : 'transparent'} strokeWidth={1.5} />
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={!hasContent || saving} style={{ width: '100%', padding: '16px', borderRadius: 16, background: hasContent ? 'linear-gradient(90deg,#6C3CE1 0%,#FF3D71 100%)' : 'var(--color-surface)', border: 'none', cursor: hasContent ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 800, color: hasContent ? '#fff' : 'var(--color-text-3)', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save entry'}
        </button>
      </div>

      {showNudge && (
        <div onClick={() => { setShowNudge(false); setSaved(true); setTimeout(() => navigate('/saved'), 800) }} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', padding: '28px 24px 44px', boxShadow: '0 -8px 48px rgba(108,60,225,0.3)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-text-3)', margin: '0 auto 24px' }} />
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6C3CE1,#FF3D71)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <BookOpen size={24} color="#fff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>Entry saved!</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.6 }}>Sign in to back up your journal across devices and never lose your creative reflections.</p>
            </div>
            <button onClick={() => { setShowNudge(false); signInWithGoogle() }} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#6C3CE1,#FF3D71)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in to back up
            </button>
            <button onClick={() => { setShowNudge(false); setSaved(true); setTimeout(() => navigate('/saved'), 800) }} style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'transparent', border: '1px solid var(--color-text-3)', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-2)' }}>
              Continue without signing in
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
