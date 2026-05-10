// @ts-nocheck
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Smile, SmilePlus, Meh, Frown, ImagePlus, Camera,
  Sparkles, Star, PenLine, Check
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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
  const { user } = useAuth()
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
  const [activeIdea, setActiveIdea] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('artly_active_idea')
      if (stored) setActiveIdea(JSON.parse(stored))
    } catch {}
  }, [])

  const hasContent = mood || text.trim() || rating > 0

  // ── Camera ──
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setShowCamera(true)
    } catch {
      alert('Camera access denied.')
    }
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

  // ── File upload ──
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setArtworkImage(ev.target?.result)
    reader.readAsDataURL(file)
  }

  // ── Prompt chips ──
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

  // ── Save ──
  const handleSave = async () => {
    if (!hasContent) return
    setSaving(true)
    const entry = {
      mood,
      text: text.trim(),
      rating,
      idea_title: activeIdea?.title || null,
      artwork_image: artworkImage || null,
      created_at: new Date().toISOString(),
    }
    try {
      if (user) {
        await supabase.from('journal_entries').insert({
          user_id: user.id,
          mood: entry.mood,
          notes: entry.text,
          rating: entry.rating,
          idea_title: entry.idea_title,
          created_at: entry.created_at,
        })
      }
      // Always save to localStorage as backup
      const existing = JSON.parse(localStorage.getItem('artly_journal_entries') || '[]')
      localStorage.setItem('artly_journal_entries', JSON.stringify([entry, ...existing]))
      setSaved(true)
      setTimeout(() => navigate('/saved'), 1200)
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

        {/* ── Progress dots ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ height: 4, borderRadius: 2, background: '#6C3CE1', width: i === 2 ? 16 : 24 }} />
          ))}
        </div>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(28px,6vw,36px)', fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Journal
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0 }}>Capture your experience and reflect on your creation.</p>
          {activeIdea && (
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(108,60,225,0.1)', border: '1px solid rgba(108,60,225,0.2)', borderRadius: 20, padding: '4px 12px' }}>
              <Sparkles size={11} color="#9b7ff0" />
              <span style={{ fontSize: 12, color: '#9b7ff0' }}>{activeIdea.title}</span>
            </div>
          )}
        </div>

        {/* ── Mood picker ── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>How did it feel?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {MOODS.map(({ id, label, Icon, color, bg, border }) => {
              const isSelected = mood === id
              return (
                <button
                  key={id}
                  onClick={() => setMood(isSelected ? null : id)}
                  style={{ background: isSelected ? bg : 'var(--color-surface)', border: `1.5px solid ${isSelected ? border : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '16px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
                >
                  <Icon size={28} color={isSelected ? color : 'var(--color-text-3)'} strokeWidth={1.5} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? color : 'var(--color-text-2)' }}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Add artwork ── */}
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
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,60,225,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImagePlus size={22} color="#6C3CE1" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 3px' }}>Upload from gallery</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>Choose from your photos</p>
                  </div>
                </button>
                <button onClick={startCamera} style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,61,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={22} color="#FF3D71" />
                  </div>
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

        {/* ── Writing prompts ── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Writing prompts — tap to add</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => appendPrompt(prompt)}
                style={{ padding: '7px 14px', background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, fontSize: 13, color: 'var(--color-text-2)', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                {prompt}
              </button>
            ))}
          </div>
          <div style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value.slice(0, 500))}
              placeholder="Write anything — what you noticed, what you'd do differently..."
              style={{ width: '100%', minHeight: 120, background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-text-3)', marginTop: 4 }}>{text.length}/500</div>
          </div>
        </div>

        {/* ── Star rating ── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Rate this session</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <Star
                    size={32}
                    color="#EF9F27"
                    fill={n <= (hoverRating || rating) ? '#EF9F27' : 'transparent'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => { 
                textareaRef.current?.focus()
                textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', border: '1.5px solid #6C3CE1', borderRadius: 12, color: '#6C3CE1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <PenLine size={14} color="#6C3CE1" /> Add notes
            </button>
          </div>
        </div>

        {/* ── Save button ── */}
        <button
          onClick={handleSave}
          disabled={!hasContent || saving}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: hasContent ? 'linear-gradient(90deg,#6C3CE1 0%,#FF3D71 100%)' : 'var(--color-surface)',
            border: 'none', cursor: hasContent ? 'pointer' : 'not-allowed',
            fontSize: 16, fontWeight: 800,
            color: hasContent ? '#fff' : 'var(--color-text-3)',
            transition: 'all 0.2s',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save entry'}
        </button>

      </div>
    </div>
  )
}
