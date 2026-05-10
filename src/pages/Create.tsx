// @ts-nocheck
import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Image, PenLine, X, Plus, Camera, ChevronRight, Sparkles, Zap,
  AlignLeft, RefreshCw, Check, Heart, Clock, Paintbrush2, Edit2,
  ArrowRight, ChevronLeft
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type InputMethod = 'upload' | 'camera' | 'describe' | null
type InputData = { image?: string; description?: string; method: InputMethod }
type Material = { name: string; category: string; confidence: string }
type Screen = 'selection' | 'detecting' | 'confirmation' | 'error' | 'ideas'

interface PaletteColour { hex: string; name: string }
interface Idea {
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  steps: string[]
  materialsUsed?: string
  palette?: PaletteColour[]
  mixHint?: string
  paletteLoading?: boolean
  paletteError?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLOUR_KEYWORDS = [
  'paint', 'watercolor', 'watercolour', 'acrylic', 'pastel', 'chalk',
  'crayon', 'ink', 'dye', 'charcoal', 'colored pencil', 'coloured pencil',
  'marker', 'pigment', 'oil paint', 'tempera', 'gouache', 'watercolors',
  'pressed flowers', 'pressed leaves', 'flowers', 'leaves',
]

function filterColourMaterials(materials: Material[]): string[] {
  return materials
    .filter(m => COLOUR_KEYWORDS.some(k => m.name.toLowerCase().includes(k)))
    .map(m => m.name)
}

function savedKey(title: string) { return `artly_saved_${title}` }

// ─── GuestSaveSheet ───────────────────────────────────────────────────────────

function GuestSaveSheet({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  const handleSignIn = () => { onSignIn() }
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', padding: '28px 24px 44px', boxShadow: '0 -8px 48px rgba(108,60,225,0.3)' }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-text-3)', margin: '0 auto 28px' }} />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #6C3CE1, #FF3D71)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Heart size={26} color="#fff" fill="#fff" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 10px' }}>Save your ideas</h3>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.6 }}>
            Sign in to save ideas across sessions and build your creative collection.
          </p>
        </div>
        <button
          onClick={handleSignIn}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #6C3CE1 0%, #FF3D71 100%)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'transparent', border: '1px solid var(--color-text-3)', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-2)' }}
        >
          Continue as guest
        </button>
      </div>
    </div>
  )
}

// ─── IdeaCard ─────────────────────────────────────────────────────────────────

function IdeaCard({ idea, index, total, isSaved, onToggleSave, onStartProject }: {
  idea: Idea; index: number; total: number
  isSaved: boolean; onToggleSave: () => void; onStartProject: () => void
}) {
  const dc = {
    beginner:     { bg: 'rgba(29,158,117,0.15)', text: '#1D9E75', border: '#1D9E75' },
    intermediate: { bg: 'rgba(239,159,39,0.15)', text: '#EF9F27', border: '#EF9F27' },
    advanced:     { bg: 'rgba(255,61,113,0.15)',  text: '#FF3D71', border: '#FF3D71' },
  }[idea.difficulty] || { bg: 'rgba(29,158,117,0.15)', text: '#1D9E75', border: '#1D9E75' }

  const seed = encodeURIComponent(idea.title.replace(/\s+/g, '-').toLowerCase())

  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(108,60,225,0.2)', width: '100%' }}>

      {/* Image */}
      <div style={{ position: 'relative' }}>
        <img
          src={`https://picsum.photos/seed/${seed}/600/320`}
          alt={idea.title}
          style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
        />
        {/* Badge */}
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(108,60,225,0.85)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Sparkles size={12} color="#c4b0ff" />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#c4b0ff' }}>Generated for you</span>
        </div>
        {/* Heart */}
        <button
          onClick={e => { e.stopPropagation(); onToggleSave() }}
          style={{ position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: '50%', background: isSaved ? '#FF3D71' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', border: isSaved ? 'none' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Heart size={17} color="#fff" fill={isSaved ? '#fff' : 'none'} />
        </button>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 16px 20px' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px', lineHeight: 1.2 }}>{idea.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 12px', lineHeight: 1.55 }}>{idea.description}</p>

        {idea.materialsUsed && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(108,60,225,0.12)', border: '1px solid rgba(108,60,225,0.2)', borderRadius: 20, padding: '5px 12px', marginBottom: 12 }}>
            <Sparkles size={11} color="#9b7ff0" />
            <span style={{ fontSize: 12, color: '#9b7ff0' }}>{idea.materialsUsed}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}>
            {idea.difficulty.charAt(0).toUpperCase() + idea.difficulty.slice(1)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'rgba(239,159,39,0.12)', color: '#EF9F27', border: '1px solid #EF9F27', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> {idea.estimatedTime}
          </span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Suggested colour palette</p>
          {idea.paletteLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #6C3CE1', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Loading palette...</span>
            </div>
          ) : idea.palette && idea.palette.length > 0 ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {idea.palette.map((c, i) => (
                  <div key={i} style={{ width: 44, height: 44, borderRadius: 10, background: c.hex, border: '1px solid rgba(255,255,255,0.12)' }} title={c.name} />
                ))}
              </div>
              {idea.mixHint && <MixHintLine hint={idea.mixHint} />}
            </>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>No colour materials detected</span>
          )}
        </div>

        <button onClick={onStartProject} style={{ width: '100%', padding: '15px', borderRadius: 14, background: 'linear-gradient(90deg, #6C3CE1 0%, #FF3D71 100%)', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Start this project <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}


// ─── MixHintLine ──────────────────────────────────────────────────────────────

function MixHintLine({ hint }: { hint: string }) {
  const colourMap: Record<string, string> = {
    Green: '#1D9E75', Yellow: '#EF9F27', Brown: '#a0522d', Blue: '#3D9BE9',
    Red: '#FF3D71', Purple: '#6C3CE1', Pink: '#FF3D71', Orange: '#EF9F27',
    White: '#ffffff', Black: '#888', Grey: '#A0A0C0', Gray: '#A0A0C0',
    Teal: '#1D9E75', Violet: '#6C3CE1', Indigo: '#4B5FD6',
  }
  const parts = hint.split(/(\b[A-Z][a-z]+\b)/)
  return (
    <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      <Paintbrush2 size={12} color="var(--color-text-3)" />
      {parts.map((p, i) =>
        colourMap[p]
          ? <span key={i} style={{ color: colourMap[p], fontWeight: 700 }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </p>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Create() {
  const navigate = useNavigate()

  // Input / detection state (unchanged from original)
  const [selectedMethod, setSelectedMethod] = useState<InputMethod>(null)
  const [inputData, setInputData] = useState<InputData>({ method: null })
  const [currentScreen, setCurrentScreen] = useState<Screen>('selection')
  const [detectedMaterials, setDetectedMaterials] = useState<Material[]>([])
  const [manualMaterial, setManualMaterial] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Ideas + carousel state
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [savedIdeas, setSavedIdeas] = useState<Record<string, boolean>>({})
  const [showGuestSheet, setShowGuestSheet] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)

  // ── Auth helper ──
  const { user, signInWithGoogle } = useAuth()
  const isGuest = () => !user

  // ── Camera helpers (unchanged) ──
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setSelectedMethod('camera')
    } catch {
      alert('Camera access denied. Please allow camera permissions.')
    }
  }
  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        setInputData({ image: canvas.toDataURL('image/jpeg'), method: 'camera' })
        stopCamera()
      }
    }
  }
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setInputData({ image: ev.target?.result as string, method: 'upload' })
      setSelectedMethod('upload')
    }
    reader.readAsDataURL(file)
  }

  // ── Detection (unchanged logic) ──
  const detectMaterials = async () => {
    setCurrentScreen('detecting')
    setError(null)
    try {
      const body: any = {}
      if (inputData.image) body.image = inputData.image.split(',')[1]
      else if (inputData.description) body.text = inputData.description
      else throw new Error('No input data')

      const res = await fetch('/api/detect-materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'API failed') }
      const data = await res.json()
      if (!Array.isArray(data.materials) || data.materials.length === 0) throw new Error('No materials detected')
      setDetectedMaterials(data.materials)
      setCurrentScreen('confirmation')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Detection failed')
      setCurrentScreen('error')
    }
  }

  const removeMaterial = (i: number) => setDetectedMaterials(prev => prev.filter((_, idx) => idx !== i))
  const addManualMaterial = () => {
    if (manualMaterial.trim()) {
      setDetectedMaterials(prev => [...prev, { name: manualMaterial.trim(), category: 'other', confidence: 'manual' }])
      setManualMaterial('')
    }
  }

  // ── Ideas generation ──
  const generateIdeas = async () => {
    setCurrentScreen('ideas')
    setError(null)
    setIdeas([])
    setActiveIndex(0)
    try {
      const skillLevel = localStorage.getItem('artly_skill') || 'beginner'
      const res = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: detectedMaterials.map(m => m.name), skillLevel }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'API failed') }
      const data = await res.json()
      const rawIdeas: Idea[] = (data.ideas || []).map((idea: any) => ({
        ...idea,
        palette: [],
        mixHint: '',
        paletteLoading: true,
        paletteError: false,
      }))
      setIdeas(rawIdeas)
      // Load palettes for all ideas in parallel
      rawIdeas.forEach((idea, idx) => loadPalette(idea, idx))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ideas generation failed')
      setCurrentScreen('error')
    }
  }

  // ── Palette loading per idea ──
  const loadPalette = async (idea: Idea, idx: number) => {
    const colourMats = filterColourMaterials(detectedMaterials)
    if (colourMats.length === 0) {
      setIdeas(prev => prev.map((it, i) => i === idx ? { ...it, paletteLoading: false } : it))
      return
    }
    try {
      const res = await fetch('/api/generate-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: colourMats, ideaTitle: idea.title, ideaSteps: idea.steps || [] }),
      })
      if (!res.ok) throw new Error('Palette API failed')
      const data = await res.json()
      const palette: PaletteColour[] = (data.colors || []).map((c: any) => ({ hex: c.hex, name: c.name }))
      const mixHint = data.mixHint || data.mixing_hint || data.hint || ''
      setIdeas(prev => prev.map((it, i) =>
        i === idx ? { ...it, palette, mixHint, paletteLoading: false, paletteError: false } : it
      ))
    } catch {
      setIdeas(prev => prev.map((it, i) => i === idx ? { ...it, paletteLoading: false, paletteError: true } : it))
    }
  }

  // ── Heart / save ──
  const handleToggleSave = (idea: Idea) => {
    if (isGuest()) { setShowGuestSheet(true); return }
    const key = savedKey(idea.title)
    setSavedIdeas(prev => ({ ...prev, [key]: !prev[key] }))
    // Supabase persistence — wired up when saved_ideas table is created
  }

  // ── Carousel swipe ──
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIndex < ideas.length - 1) setActiveIndex(i => i + 1)
      if (diff < 0 && activeIndex > 0) setActiveIndex(i => i - 1)
    }
  }

  // ── Misc ──
  const tryAgain = () => { setCurrentScreen('selection'); setSelectedMethod(null); setInputData({ method: null }); setDetectedMaterials([]); setIdeas([]) }
  const backToSelection = () => { setCurrentScreen('selection'); setSelectedMethod(null); setInputData({ method: null }) }

  // ─── Styles ────────────────────────────────────────────────────────────────

  const s = {
    page: { minHeight: '100dvh', backgroundColor: 'var(--color-bg)', paddingBottom: 80, boxSizing: 'border-box' as const },
    wrap: { maxWidth: 640, margin: '0 auto', padding: 'clamp(16px,4vw,32px) 16px' },
    heading: { fontSize: 'clamp(22px,5vw,30px)', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px', textAlign: 'center' as const },
    subheading: { fontSize: 'clamp(13px,3vw,15px)', color: 'var(--color-text-2)', margin: '0 0 28px', textAlign: 'center' as const, lineHeight: 1.5 },
    card: { backgroundColor: 'var(--color-surface)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' },
    gradBtn: { width: '100%', height: 52, background: 'linear-gradient(90deg,#6C3CE1 0%,#FF3D71 100%)', border: 'none', borderRadius: 16, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
    outlineBtn: { height: 48, backgroundColor: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: 'var(--color-text)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={s.wrap}>

        {/* ── SELECTION ── */}
        {currentScreen === 'selection' && !selectedMethod && (
          <>
            <h1 style={s.heading}>What would you like to <span style={{ color: 'var(--color-accent)' }}>use?</span></h1>
            <p style={s.subheading}>Add your materials in any way that's easiest for you. <span style={{ color: 'var(--color-primary)' }}>We'll identify them automatically.</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {/* Add Photos */}
              <div onClick={() => fileInputRef.current?.click()} style={s.card}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#6C3CE1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Image size={24} color="white" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Add Photos</p>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-text-2)' }}>Upload a photo from your gallery</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(108,60,225,0.12)', borderRadius: 8, padding: '4px 10px' }}>
                    <Image size={12} color="#6C3CE1" />
                    <span style={{ fontSize: 11, color: '#6C3CE1', fontWeight: 500 }}>Best for detailed material lists</span>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--color-text-3)" />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>
              {/* Take Photo */}
              <div onClick={handleCameraCapture} style={s.card}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#C94070,#FF3D71)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={24} color="white" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Take Photo</p>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-text-2)' }}>Capture your materials using your camera</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,61,113,0.10)', borderRadius: 8, padding: '4px 10px' }}>
                    <Zap size={12} color="#FF3D71" />
                    <span style={{ fontSize: 11, color: '#FF3D71', fontWeight: 500 }}>Good lighting helps detection</span>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--color-text-3)" />
              </div>
              {/* Describe */}
              <div onClick={() => setSelectedMethod('describe')} style={s.card}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#B07820,#EF9F27)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PenLine size={24} color="white" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Describe Materials</p>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-text-2)' }}>Type or list the materials you have</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,159,39,0.10)', borderRadius: 8, padding: '4px 10px' }}>
                    <AlignLeft size={12} color="#EF9F27" />
                    <span style={{ fontSize: 11, color: '#EF9F27', fontWeight: 500 }}>Separate items with commas</span>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--color-text-3)" />
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(108,60,225,0.15)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Sparkles size={18} color="#6C3CE1" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#6C3CE1' }}>We'll detect materials automatically</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-2)' }}>You can review and edit the list in the next step.</p>
              </div>
            </div>
          </>
        )}

        {/* ── UPLOAD PREVIEW ── */}
        {currentScreen === 'selection' && selectedMethod === 'upload' && inputData.image && (
          <>
            <h1 style={s.heading}>What do you have?</h1>
            <p style={{ ...s.subheading, marginBottom: 16 }}>Show us your materials and we'll spark your creativity</p>
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Uploaded Image</span>
                <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-2)' }}>
                  <PenLine size={12} /> Change
                </button>
              </div>
              <img src={inputData.image} alt="Uploaded" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 280 }} />
            </div>
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Sparkles size={16} color="#6C3CE1" />
              <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>We'll detect the materials in your image automatically.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ ...s.outlineBtn, flex: 1 }}><RefreshCw size={16} /> Re-upload</button>
              <button onClick={detectMaterials} style={{ ...s.gradBtn, flex: 2, height: 48, fontSize: 14 }}><Sparkles size={16} color="white" /> Detect Materials</button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </>
        )}

        {/* ── CAMERA LIVE ── */}
        {currentScreen === 'selection' && selectedMethod === 'camera' && !inputData.image && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 16, padding: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>Take a Photo</h3>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 12, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={stopCamera} style={{ ...s.outlineBtn, flex: 1 }}>Cancel</button>
              <button onClick={takePhoto} style={{ ...s.gradBtn, flex: 2, height: 48, fontSize: 14 }}>Capture</button>
            </div>
          </div>
        )}

        {/* ── CAMERA CAPTURED ── */}
        {currentScreen === 'selection' && selectedMethod === 'camera' && inputData.image && (
          <>
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 12 }}>Captured Photo</h3>
              <img src={inputData.image} alt="Captured" style={{ width: '100%', borderRadius: 12, maxHeight: 280, objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setInputData({ method: 'camera' }); handleCameraCapture() }} style={{ ...s.outlineBtn, flex: 1 }}><RefreshCw size={16} /> Retake</button>
              <button onClick={detectMaterials} style={{ ...s.gradBtn, flex: 2, height: 48, fontSize: 14 }}><Sparkles size={16} color="white" /> Detect Materials</button>
            </div>
          </>
        )}

        {/* ── DESCRIBE ── */}
        {currentScreen === 'selection' && selectedMethod === 'describe' && (
          <>
            <h1 style={s.heading}>What do you have?</h1>
            <p style={{ ...s.subheading, marginBottom: 16 }}>Show us your materials and we'll spark your creativity</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'upload', label: 'Upload Photos', icon: <Image size={14} color="var(--color-text-3)" /> },
                { id: 'camera', label: 'Take Photo',   icon: <Camera size={14} color="var(--color-text-3)" /> },
                { id: 'describe', label: 'Describe',   icon: <PenLine size={14} color="#6C3CE1" /> },
              ].map(tab => (
                <button key={tab.id} onClick={() => {
                  if (tab.id === 'upload') fileInputRef.current?.click()
                  else if (tab.id === 'camera') handleCameraCapture()
                  else setSelectedMethod('describe')
                }} style={{ flex: 1, padding: '10px 6px', backgroundColor: tab.id === 'describe' ? 'var(--color-surface)' : 'transparent', border: tab.id === 'describe' ? '1.5px solid #6C3CE1' : '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {tab.icon}
                  <span style={{ fontSize: 11, fontWeight: 600, color: tab.id === 'describe' ? '#6C3CE1' : 'var(--color-text-3)' }}>{tab.label}</span>
                </button>
              ))}
            </div>
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Describe your materials</p>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--color-text-2)' }}>Type or list the art supplies you have</p>
              <textarea value={inputData.description || ''} onChange={e => setInputData({ ...inputData, description: e.target.value, method: 'describe' })} placeholder="Example: Watercolors, paintbrushes, canvas, sketchbook, colored pencils..." style={{ width: '100%', minHeight: 120, padding: 12, backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--color-text)', fontSize: 14, lineHeight: 1.5, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-text-3)', marginTop: 4 }}>{(inputData.description || '').length} / 500</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 8 }}>Try these examples</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Watercolors, brushes, paper', 'Acrylic paints, canvas, palette', 'Sketchbook, pencils, markers'].map(chip => (
                  <button key={chip} onClick={() => setInputData({ ...inputData, description: chip, method: 'describe' })} style={{ padding: '6px 12px', backgroundColor: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, color: 'var(--color-text-2)', fontSize: 12, cursor: 'pointer' }}>{chip}</button>
                ))}
              </div>
            </div>
            <button onClick={detectMaterials} disabled={!inputData.description?.trim()} style={{ ...s.gradBtn, opacity: inputData.description?.trim() ? 1 : 0.5, cursor: inputData.description?.trim() ? 'pointer' : 'not-allowed' }}>
              <Sparkles size={18} color="white" /> Detect Materials
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </>
        )}

        {/* ── DETECTING ── */}
        {currentScreen === 'detecting' && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 20, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6C3CE1,#FF3D71)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}>
              <Sparkles size={24} color="white" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Analysing your materials...</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0 }}>This usually takes a few seconds</p>
          </div>
        )}

        {/* ── CONFIRMATION ── */}
        {currentScreen === 'confirmation' && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 20, padding: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>We found these materials</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {detectedMaterials.map((m, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(108,60,225,0.12)', border: '1px solid rgba(108,60,225,0.25)', borderRadius: 99 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{m.name}</span>
                  <button onClick={() => removeMaterial(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={14} color="var(--color-text-3)" /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input type="text" value={manualMaterial} onChange={e => setManualMaterial(e.target.value)} placeholder="Add material..." onKeyPress={e => e.key === 'Enter' && addManualMaterial()} style={{ flex: 1, padding: '10px 14px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--color-text)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={addManualMaterial} disabled={!manualMaterial.trim()} style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6C3CE1,#FF3D71)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: manualMaterial.trim() ? 1 : 0.5 }}>
                <Plus size={20} color="white" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={tryAgain} style={{ flex: 1, height: 48, backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--color-text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Try again</button>
              <button onClick={generateIdeas} style={{ flex: 2, height: 48, background: 'linear-gradient(90deg,#6C3CE1 0%,#FF3D71 100%)', border: 'none', borderRadius: 14, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Check size={16} color="white" /> Looks good!
              </button>
            </div>
          </div>
        )}

        {/* ── IDEAS CAROUSEL ── */}
        {currentScreen === 'ideas' && (
          <>
            {/* Step dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ height: 4, borderRadius: 2, background: i === 0 ? '#6C3CE1' : 'rgba(255,255,255,0.15)', width: i === 0 ? 24 : 16, transition: 'all 0.3s' }} />
              ))}
            </div>

            {/* Heading */}
            <h1 style={{ fontSize: 'clamp(20px,5vw,26px)', fontWeight: 800, margin: '0 0 6px', textAlign: 'center', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Here's what you can create ✦
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-2)', textAlign: 'center', margin: '0 0 20px' }}>Based on your materials</p>

            {/* Materials summary bar */}
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 14, padding: '12px 14px', marginBottom: 20, border: '1px solid rgba(108,60,225,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(108,60,225,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={14} color="#9b7ff0" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Your materials</span>
                </div>
                <button onClick={() => setCurrentScreen('confirmation')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#6C3CE1', fontSize: 13, fontWeight: 600 }}>
                  <Edit2 size={13} color="#6C3CE1" /> Edit
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {detectedMaterials.slice(0, 3).map((m, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(108,60,225,0.1)', border: '1px solid rgba(108,60,225,0.2)', borderRadius: 20, fontSize: 12, color: 'var(--color-text)' }}>
                    <Paintbrush2 size={10} color="#9b7ff0" /> {m.name}
                  </span>
                ))}
                {detectedMaterials.length > 3 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', background: 'rgba(108,60,225,0.1)', border: '1px solid rgba(108,60,225,0.2)', borderRadius: 20, fontSize: 12, color: '#9b7ff0' }}>
                    +{detectedMaterials.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Loading state */}
            {ideas.length === 0 && (
              <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 20, padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6C3CE1,#FF3D71)', margin: '0 auto 16px', animation: 'spin 1s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color="white" />
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: 14, margin: 0 }}>Sparking your creativity...</p>
              </div>
            )}

            {/* Carousel */}
            {ideas.length > 0 && (
              <>
                {/* Desktop prev/next arrows + carousel */}
                <div style={{ position: 'relative' }}>
                  {/* Prev arrow — sits inside image top-left area */}
                  {activeIndex > 0 && (
                    <button
                      onClick={() => setActiveIndex(i => i - 1)}
                      style={{ position: 'absolute', left: 10, top: 90, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Previous idea"
                    >
                      <ChevronLeft size={18} color="#fff" />
                    </button>
                  )}
                  {/* Next arrow — sits inside image top-right area */}
                  {activeIndex < ideas.length - 1 && (
                    <button
                      onClick={() => setActiveIndex(i => i + 1)}
                      style={{ position: 'absolute', right: 10, top: 90, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Next idea"
                    >
                      <ChevronRight size={18} color="#fff" />
                    </button>
                  )}
                  <div
                    ref={carouselRef}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{ overflow: 'hidden', marginBottom: 16 }}
                  >
                    <div style={{ display: 'flex', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', transform: `translateX(-${activeIndex * 100}%)` }}>
                      {ideas.map((idea, idx) => (
                        <div key={idx} style={{ minWidth: '100%' }}>
                          <IdeaCard
                            idea={idea}
                            index={idx}
                            total={ideas.length}
                            isSaved={!!savedIdeas[savedKey(idea.title)]}
                            onToggleSave={() => handleToggleSave(idea)}
                            onStartProject={() => {
                              localStorage.setItem('artly_active_idea', JSON.stringify(idea))
                              navigate('/journal')
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dot indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                  {ideas.map((_, i) => (
                    <button key={i} onClick={() => setActiveIndex(i)} style={{ width: i === activeIndex ? 20 : 8, height: 8, borderRadius: 4, background: i === activeIndex ? '#6C3CE1' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} aria-label={`Idea ${i + 1}`} />
                  ))}
                </div>
                {ideas.length - activeIndex - 1 > 0 && (
                  <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-3)', margin: '0 0 20px' }}>
                    {ideas.length - activeIndex - 1} more {ideas.length - activeIndex - 1 === 1 ? 'idea' : 'ideas'} available
                  </p>
                )}
              </>
            )}

            <button onClick={tryAgain} style={{ width: '100%', height: 44, backgroundColor: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--color-text-2)', fontSize: 14, cursor: 'pointer' }}>
              Start over
            </button>
          </>
        )}

        {/* ── ERROR ── */}
        {currentScreen === 'error' && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 20, padding: '32px 24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
              {error === 'No materials detected' ? 'No materials found' : 'Something went wrong'}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 24 }}>
              {error === 'No materials detected' ? "We couldn't detect any materials. Try a clearer photo or describe your materials instead." : error}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={backToSelection} style={{ padding: '12px 20px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--color-text-2)', fontSize: 14, cursor: 'pointer' }}>Back</button>
              <button onClick={tryAgain} style={{ padding: '12px 20px', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', border: 'none', borderRadius: 14, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Try again</button>
            </div>
          </div>
        )}

      </div>

      {/* ── GUEST SAVE SHEET ── */}
      {showGuestSheet && <GuestSaveSheet onClose={() => setShowGuestSheet(false)} onSignIn={() => { setShowGuestSheet(false); signInWithGoogle() }} />}
    </div>
  )
}
