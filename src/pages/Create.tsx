import { useState, useRef, type ChangeEvent } from 'react'
import { Image, PenLine, X, Plus, Camera, BookOpen, ChevronDown, ChevronUp, ChevronRight, Sparkles, Zap, AlignLeft, RefreshCw, Check } from 'lucide-react'

type InputMethod = 'upload' | 'camera' | 'describe' | null
type InputData = {
  image?: string
  description?: string
  method: InputMethod
}

type Material = {
  name: string
  category: string
  confidence: string
}

type Screen = 'selection' | 'detecting' | 'confirmation' | 'error' | 'ideas' | 'palette' | 'kit'

type Idea = {
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  steps: string[]
}

type KitItem = {
  item: string
  reason: string
  estimatedPrice: string
  localAlternative?: string
}

type ShoppingKit = {
  essentials: KitItem[]
  niceToHave: KitItem[]
  totalEstimatedCost: string
  complementaryPairs: { color1: string; color2: string; useCase: string }[]
}

export default function Create() {
  const [selectedMethod, setSelectedMethod] = useState<InputMethod>(null)
  const [inputData, setInputData] = useState<InputData>({ method: null })
  const [currentScreen, setCurrentScreen] = useState<Screen>('selection')
  const [detectedMaterials, setDetectedMaterials] = useState<Material[]>([])
  const [manualMaterial, setManualMaterial] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [themeInput, setThemeInput] = useState('')
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null)
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [colourMatches, setColourMatches] = useState<any[]>([])
  const [materialInsights, setMaterialInsights] = useState<any[]>([])
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [loadingInsights, setLoadingInsights] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setInputData({ image: imageUrl, method: 'upload' })
        setSelectedMethod('upload')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setSelectedMethod('camera')
    } catch (error) {
      console.error('Camera access denied:', error)
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
        const imageUrl = canvas.toDataURL('image/jpeg')
        setInputData({ image: imageUrl, method: 'camera' })
        stopCamera()
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const handleRetake = () => {
    setInputData({ method: selectedMethod })
    if (selectedMethod === 'camera') handleCameraCapture()
  }

  const detectMaterials = async () => {
    setCurrentScreen('detecting')
    setError(null)
    try {
      let requestBody: any = {}
      if (inputData.image) {
        requestBody.image = inputData.image.split(',')[1]
      } else if (inputData.description) {
        requestBody.text = inputData.description
      } else {
        throw new Error('No input data available')
      }
      const response = await fetch('/api/detect-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'API request failed')
      }
      const data = await response.json()
      const materials = data.materials
      if (!Array.isArray(materials)) throw new Error('Invalid response format')
      if (materials.length === 0) throw new Error('No materials detected')
      setDetectedMaterials(materials)
      setCurrentScreen('confirmation')
    } catch (error) {
      console.error('Detection failed:', error)
      setError(error instanceof Error ? error.message : 'Detection failed')
      setCurrentScreen('error')
    }
  }

  const handleDetectMaterials = () => { detectMaterials() }

  const addManualMaterial = () => {
    if (manualMaterial.trim()) {
      const newMaterial: Material = { name: manualMaterial.trim(), category: 'other', confidence: 'manual' }
      setDetectedMaterials([...detectedMaterials, newMaterial])
      setManualMaterial('')
    }
  }

  const removeMaterial = (index: number) => {
    setDetectedMaterials(detectedMaterials.filter((_, i) => i !== index))
  }

  const generateIdeas = async (theme?: string) => {
    setCurrentScreen('ideas')
    setError(null)
    setIdeas([])
    setExpandedIdea(null)
    try {
      const skillLevel = localStorage.getItem('artly_skill') || 'beginner'
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: detectedMaterials.map(m => m.name), skillLevel, theme: theme || undefined }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'API request failed')
      }
      const data = await response.json()
      setIdeas(data.ideas || [])
    } catch (error) {
      console.error('Ideas generation failed:', error)
      setError(error instanceof Error ? error.message : 'Ideas generation failed')
      setCurrentScreen('error')
    }
  }

  const generatePalette = async () => {
    setCurrentScreen('palette')
    setError(null)
    const colourMaterials = filterColourMaterials(detectedMaterials)
    if (colourMaterials.length === 0) return
    try {
      const response = await fetch('/api/generate-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: colourMaterials, ideaTitle: selectedIdea?.title || undefined, ideaSteps: selectedIdea?.steps || [] }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'API request failed')
      }
      const data = await response.json()
      if (data.colors && Array.isArray(data.colors)) {
        setColourMatches(data.colors.map((color: any) => ({
          hex: color.hex, name: color.name, status: 'have' as const, matchedMaterial: color.materialSource
        })))
      }
    } catch (error) {
      console.error('Palette generation failed:', error)
      setError(error instanceof Error ? error.message : 'Palette generation failed')
      setCurrentScreen('error')
    }
  }

  const loadMaterialInsights = async () => {
    setLoadingInsights(true)
    try {
      const response = await fetch('/api/material-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: detectedMaterials.map(m => m.name) }),
      })
      if (!response.ok) throw new Error('Failed to load material insights')
      const insights = await response.json()
      setMaterialInsights(insights)
    } catch (error) {
      console.error('Error loading material insights:', error)
    } finally {
      setLoadingInsights(false)
    }
  }

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(index)) newExpanded.delete(index)
    else newExpanded.add(index)
    setExpandedCards(newExpanded)
  }

  const filterColourMaterials = (materials: Material[]): string[] => {
    const colourMaterials = ['paint', 'watercolor', 'watercolour', 'acrylic', 'pastel', 'chalk', 'crayon', 'ink', 'dye', 'charcoal', 'colored pencil', 'marker', 'pressed flowers', 'pressed leaves', 'flowers', 'leaves', 'pigment', 'oil paint', 'tempera', 'gouache', 'watercolor paint', 'acrylic paint', 'oil paints', 'watercolors', 'coloured pencils']
    return materials.filter(m => colourMaterials.some(cm => m.name.toLowerCase().includes(cm.toLowerCase()))).map(m => m.name)
  }

  const confirmMaterials = () => { generateIdeas() }
  const tryAgain = () => { setCurrentScreen('selection'); setError(null); setDetectedMaterials([]) }
  const backToSelection = () => { setCurrentScreen('selection'); setSelectedMethod(null); setInputData({ method: null }) }

  const s = {
    page: { minHeight: '100dvh', backgroundColor: 'var(--color-bg)', paddingBottom: '80px', boxSizing: 'border-box' as const },
    wrap: { maxWidth: '640px', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px) 16px' },
    heading: { fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: '800', color: 'var(--color-text)', margin: '0 0 8px', textAlign: 'center' as const },
    subheading: { fontSize: 'clamp(13px, 3vw, 15px)', color: 'var(--color-text-2)', margin: '0 0 28px', textAlign: 'center' as const, lineHeight: 1.5 },
    card: { backgroundColor: 'var(--color-surface)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' },
    gradBtn: { width: '100%', height: '52px', background: 'linear-gradient(90deg, #6C3CE1 0%, #FF3D71 100%)', border: 'none', borderRadius: '16px', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    outlineBtn: { height: '48px', backgroundColor: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'var(--color-text)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  }

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        {/* SELECTION SCREEN */}
        {currentScreen === 'selection' && !selectedMethod && (
          <>
            <h1 style={s.heading}>
              What would you like to <span style={{ color: 'var(--color-accent)' }}>use?</span>
            </h1>
            <p style={s.subheading}>
              Add your materials in any way that's easiest for you.{' '}
              <span style={{ color: 'var(--color-primary)' }}>We'll identify them automatically.</span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>

              {/* Add Photos */}
              <div onClick={() => fileInputRef.current?.click()} style={s.card}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Image size={24} color="white" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: '700', color: 'var(--color-text)' }}>Add Photos</p>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-2)' }}>Upload one or more photos from your gallery</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(108,60,225,0.12)', borderRadius: '8px', padding: '4px 10px' }}>
                    <Image size={12} color="#6C3CE1" />
                    <span style={{ fontSize: '11px', color: '#6C3CE1', fontWeight: '500' }}>Multiple images supported</span>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--color-text-3)" />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>

              {/* Take Photo */}
              <div onClick={handleCameraCapture} style={s.card}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #C94070, #FF3D71)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={24} color="white" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: '700', color: 'var(--color-text)' }}>Take Photo</p>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-2)' }}>Capture your materials using your camera</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,61,113,0.10)', borderRadius: '8px', padding: '4px 10px' }}>
                    <Zap size={12} color="#FF3D71" />
                    <span style={{ fontSize: '11px', color: '#FF3D71', fontWeight: '500' }}>Good lighting helps better detection</span>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--color-text-3)" />
              </div>

              {/* Describe Materials */}
              <div onClick={() => setSelectedMethod('describe')} style={s.card}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #B07820, #EF9F27)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PenLine size={24} color="white" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: '700', color: 'var(--color-text)' }}>Describe Materials</p>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-2)' }}>Type or list the materials you have</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(239,159,39,0.10)', borderRadius: '8px', padding: '4px 10px' }}>
                    <AlignLeft size={12} color="#EF9F27" />
                    <span style={{ fontSize: '11px', color: '#EF9F27', fontWeight: '500' }}>Separate items with commas</span>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--color-text-3)" />
              </div>
            </div>

            {/* Info bar */}
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(108,60,225,0.15)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Sparkles size={18} color="#6C3CE1" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#6C3CE1' }}>We'll detect materials automatically</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-2)' }}>You can review and edit the list in the next step.</p>
              </div>
            </div>
          </>
        )}

        {/* 4A: UPLOADED IMAGE */}
        {currentScreen === 'selection' && selectedMethod === 'upload' && inputData.image && (
          <>
            <h1 style={s.heading}>What do you have?</h1>
            <p style={{ ...s.subheading, marginBottom: '16px' }}>Show us your materials and we'll spark your creativity</p>
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>Uploaded Image</span>
                <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--color-text-2)' }}>
                  <PenLine size={12} color="var(--color-text-2)" /> Change
                </button>
              </div>
              <img src={inputData.image} alt="Uploaded" style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '280px' }} />
            </div>
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Sparkles size={16} color="#6C3CE1" />
              <span style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>We'll detect the materials in your image automatically.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ ...s.outlineBtn, flex: 1 }}>
                <RefreshCw size={16} color="var(--color-text)" /> Re-upload
              </button>
              <button onClick={handleDetectMaterials} style={{ ...s.gradBtn, flex: 2, height: '48px', fontSize: '14px' }}>
                <Sparkles size={16} color="white" /> Detect Materials
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </>
        )}

        {/* CAMERA - live */}
        {currentScreen === 'selection' && selectedMethod === 'camera' && !inputData.image && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '16px', padding: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '12px' }}>Take a Photo</h3>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={stopCamera} style={{ ...s.outlineBtn, flex: 1, backgroundColor: 'var(--color-bg)' }}>Cancel</button>
              <button onClick={takePhoto} style={{ ...s.gradBtn, flex: 2, height: '48px', fontSize: '14px' }}>Capture</button>
            </div>
          </div>
        )}

        {/* CAMERA - captured */}
        {currentScreen === 'selection' && selectedMethod === 'camera' && inputData.image && (
          <>
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '12px' }}>Captured Photo</h3>
              <img src={inputData.image} alt="Captured" style={{ width: '100%', borderRadius: '12px', maxHeight: '280px', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleRetake} style={{ ...s.outlineBtn, flex: 1 }}>
                <RefreshCw size={16} color="var(--color-text)" /> Retake
              </button>
              <button onClick={handleDetectMaterials} style={{ ...s.gradBtn, flex: 2, height: '48px', fontSize: '14px' }}>
                <Sparkles size={16} color="white" /> Detect Materials
              </button>
            </div>
          </>
        )}

        {/* 4B: DESCRIBE */}
        {currentScreen === 'selection' && selectedMethod === 'describe' && (
          <>
            <h1 style={s.heading}>What do you have?</h1>
            <p style={{ ...s.subheading, marginBottom: '16px' }}>Show us your materials and we'll spark your creativity</p>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {[
                { id: 'upload', label: 'Upload Photos', icon: <Image size={14} color="var(--color-text-3)" /> },
                { id: 'camera', label: 'Take Photo', icon: <Camera size={14} color="var(--color-text-3)" /> },
                { id: 'describe', label: 'Describe', icon: <PenLine size={14} color="#6C3CE1" /> },
              ].map((tab) => (
                <button key={tab.id} onClick={() => {
                  if (tab.id === 'upload') fileInputRef.current?.click()
                  else if (tab.id === 'camera') handleCameraCapture()
                  else setSelectedMethod('describe')
                }} style={{
                  flex: 1, padding: '10px 6px',
                  backgroundColor: tab.id === 'describe' ? 'var(--color-surface)' : 'transparent',
                  border: tab.id === 'describe' ? '1.5px solid #6C3CE1' : '1.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                }}>
                  {tab.icon}
                  <span style={{ fontSize: '11px', fontWeight: '600', color: tab.id === 'describe' ? '#6C3CE1' : 'var(--color-text-3)' }}>{tab.label}</span>
                </button>
              ))}
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>Describe your materials</p>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--color-text-2)' }}>Type or list the art supplies you have</p>
              <textarea
                value={inputData.description || ''}
                onChange={(e) => setInputData({ ...inputData, description: e.target.value, method: 'describe' })}
                placeholder="Example: Watercolors, paintbrushes, canvas, sketchbook, colored pencils..."
                style={{ width: '100%', minHeight: '120px', padding: '12px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--color-text)', fontSize: '14px', lineHeight: '1.5', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--color-text-3)', marginTop: '4px' }}>
                {(inputData.description || '').length} / 500
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '8px' }}>Try these examples</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Watercolors, brushes, paper', 'Acrylic paints, canvas, palette', 'Sketchbook, pencils, markers'].map((chip) => (
                  <button key={chip} onClick={() => setInputData({ ...inputData, description: chip, method: 'describe' })} style={{ padding: '6px 12px', backgroundColor: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px', color: 'var(--color-text-2)', fontSize: '12px', cursor: 'pointer' }}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Sparkles size={16} color="#6C3CE1" />
              <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>We'll identify your materials and suggest ideas just for you.</span>
            </div>

            <button onClick={handleDetectMaterials} disabled={!inputData.description?.trim()} style={{ ...s.gradBtn, opacity: inputData.description?.trim() ? 1 : 0.5, cursor: inputData.description?.trim() ? 'pointer' : 'not-allowed' }}>
              <Sparkles size={18} color="white" /> Detect Materials
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </>
        )}

        {/* DETECTING */}
        {currentScreen === 'detecting' && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', padding: '48px 24px', textAlign: 'center' }}>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C3CE1, #FF3D71)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}>
              <Sparkles size={24} color="white" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>Analysing your materials...</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-2)', margin: 0 }}>This usually takes a few seconds</p>
          </div>
        )}

        {/* CONFIRMATION */}
        {currentScreen === 'confirmation' && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', padding: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '16px' }}>We found these materials</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {detectedMaterials.map((material, index) => (
                <div key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(108,60,225,0.12)', border: '1px solid rgba(108,60,225,0.25)', borderRadius: '99px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{material.name}</span>
                  <button onClick={() => removeMaterial(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <X size={14} color="var(--color-text-3)" />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input type="text" value={manualMaterial} onChange={(e) => setManualMaterial(e.target.value)} placeholder="Add material..." onKeyPress={(e) => e.key === 'Enter' && addManualMaterial()} style={{ flex: 1, padding: '10px 14px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--color-text)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={addManualMaterial} disabled={!manualMaterial.trim()} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6C3CE1, #FF3D71)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: manualMaterial.trim() ? 1 : 0.5 }}>
                <Plus size={20} color="white" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={tryAgain} style={{ flex: 1, height: '48px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'var(--color-text-2)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Try again</button>
              <button onClick={confirmMaterials} style={{ flex: 2, height: '48px', background: 'linear-gradient(90deg, #6C3CE1 0%, #FF3D71 100%)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Check size={16} color="white" /> Looks good!
              </button>
            </div>
          </div>
        )}

        {/* IDEAS */}
        {currentScreen === 'ideas' && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text)', margin: 0 }}>Creative Ideas</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={themeInput} onChange={(e) => setThemeInput(e.target.value)} placeholder="e.g. calm, bold..." style={{ padding: '8px 12px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'var(--color-text)', fontSize: '13px', outline: 'none', width: '120px', fontFamily: 'inherit' }} />
                <button onClick={() => generateIdeas(themeInput)} style={{ padding: '8px 14px', background: 'linear-gradient(90deg, #6C3CE1, #FF3D71)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Apply</button>
              </div>
            </div>
            {ideas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C3CE1, #FF3D71)', margin: '0 auto 16px', animation: 'spin 1s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color="white" />
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Sparking your creativity...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {ideas.map((idea, index) => (
                  <div key={index} style={{ backgroundColor: 'var(--color-bg)', borderRadius: '16px', overflow: 'hidden' }}>
                    <img src={`https://picsum.photos/seed/${encodeURIComponent(idea.title)}/600/200`} alt={idea.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text)', margin: 0, flex: 1 }}>{idea.title}</h4>
                        <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', backgroundColor: idea.difficulty === 'beginner' ? 'rgba(29,158,117,0.15)' : idea.difficulty === 'intermediate' ? 'rgba(239,159,39,0.15)' : 'rgba(255,61,113,0.15)', color: idea.difficulty === 'beginner' ? '#1D9E75' : idea.difficulty === 'intermediate' ? '#EF9F27' : '#FF3D71' }}>{idea.difficulty}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{idea.estimatedTime}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-2)', margin: '0 0 12px', lineHeight: 1.5 }}>{idea.description}</p>
                      <button onClick={() => setExpandedIdea(expandedIdea === index ? null : index)} style={{ background: 'none', border: 'none', color: '#6C3CE1', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
                        {expandedIdea === index ? 'Hide steps' : 'See steps'}
                      </button>
                      {expandedIdea === index && (
                        <ol style={{ paddingLeft: '16px', margin: '0 0 12px' }}>
                          {idea.steps.map((step, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '4px' }}>{step}</li>)}
                        </ol>
                      )}
                      <button onClick={() => { setSelectedIdea(idea); setCurrentScreen('palette'); generatePalette() }} style={{ width: '100%', height: '44px', background: 'linear-gradient(90deg, #6C3CE1 0%, #FF3D71 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Sparkles size={16} color="white" /> Start this project
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={tryAgain} style={{ width: '100%', marginTop: '16px', height: '44px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--color-text-2)', fontSize: '14px', cursor: 'pointer' }}>Start over</button>
          </div>
        )}

        {/* PALETTE */}
        {currentScreen === 'palette' && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', padding: '20px' }}>
            {selectedIdea && (
              <div style={{ background: 'rgba(108,60,225,0.08)', border: '1px solid rgba(108,60,225,0.2)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6C3CE1' }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>Creating: <strong>{selectedIdea.title}</strong></span>
                </div>
                <button onClick={() => { setSelectedIdea(null); setCurrentScreen('ideas') }} style={{ background: 'none', border: 'none', color: '#6C3CE1', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Change</button>
              </div>
            )}
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '16px' }}>
              {selectedIdea ? `Palette for ${selectedIdea.title}` : 'Your Colour Palette'}
            </h3>
            {selectedIdea && (
              <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <img src={`https://picsum.photos/seed/${encodeURIComponent(selectedIdea.title)}/120/80`} alt={selectedIdea.title} style={{ width: '100px', height: '70px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    {colourMatches.length === 0 ? (
                      filterColourMaterials(detectedMaterials).length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>No colour materials detected.</p>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C3CE1, #FF3D71)', animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>Generating palette...</span>
                        </div>
                      )
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                          {colourMatches.map((match, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: match.hex, border: '2px solid rgba(255,255,255,0.1)' }} title={match.name} />
                              <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: match.status === 'have' ? '#1D9E75' : '#6C3CE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: '700' }}>
                                {match.status === 'have' ? '✓' : '+'}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--color-text-3)' }}>
                          <span>✓ You have this</span><span>+ Add to kit</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => generatePalette()} style={{ flex: 1, height: '48px', background: 'linear-gradient(90deg, #6C3CE1, #FF3D71)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Mixing Guide</button>
              <button onClick={tryAgain} style={{ flex: 1, height: '48px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'var(--color-text-2)', fontSize: '14px', cursor: 'pointer' }}>Start over</button>
            </div>
          </div>
        )}

        {/* KIT */}
        {currentScreen === 'kit' && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', padding: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '16px' }}>
              {selectedIdea ? `Your Kit for ${selectedIdea.title}` : 'Your Art Kit'}
            </h3>
            {kit === null ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C3CE1, #FF3D71)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Building your kit...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: '14px', padding: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '12px' }}>Essentials</h4>
                  {kit.essentials.map((item, index) => (
                    <div key={index} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>{item.item}</span>
                        <span style={{ fontSize: '13px', color: '#6C3CE1', fontWeight: '600' }}>{item.estimatedPrice}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-2)', margin: '2px 0 0' }}>{item.reason}</p>
                    </div>
                  ))}
                </div>
                <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: '14px', padding: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '12px' }}>Nice to Have</h4>
                  {kit.niceToHave.map((item, index) => (
                    <div key={index} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>{item.item}</span>
                        <span style={{ fontSize: '13px', color: '#6C3CE1', fontWeight: '600' }}>{item.estimatedPrice}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-2)', margin: '2px 0 0' }}>{item.reason}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  {detectedMaterials.length > 0 && (
                    <button onClick={loadMaterialInsights} disabled={loadingInsights} style={{ flex: 1, height: '48px', background: 'linear-gradient(90deg, #6C3CE1, #FF3D71)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: loadingInsights ? 0.7 : 1 }}>
                      <BookOpen size={16} color="white" /> {loadingInsights ? 'Loading...' : 'Insights'}
                    </button>
                  )}
                  <button onClick={tryAgain} style={{ flex: 1, height: '48px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'var(--color-text-2)', fontSize: '14px', cursor: 'pointer' }}>Start over</button>
                </div>
                {materialInsights.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '12px' }}>Material Insights</h4>
                    {materialInsights.map((insight, index) => (
                      <div key={index} style={{ backgroundColor: 'var(--color-bg)', borderRadius: '12px', padding: '14px', marginBottom: '8px' }}>
                        <button onClick={() => toggleCard(index)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{insight.material}</span>
                          {expandedCards.has(index) ? <ChevronUp size={18} color="var(--color-text-2)" /> : <ChevronDown size={18} color="var(--color-text-2)" />}
                        </button>
                        {expandedCards.has(index) && (
                          <div style={{ marginTop: '12px' }}>
                            {insight.tips?.length > 0 && <div style={{ marginBottom: '8px' }}><p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>Tips</p>{insight.tips.map((tip: string, i: number) => <p key={i} style={{ fontSize: '12px', color: '#6C3CE1', margin: '2px 0' }}>• {tip}</p>)}</div>}
                            {insight.careInstructions?.length > 0 && <div style={{ marginBottom: '8px' }}><p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>Care</p>{insight.careInstructions.map((c: string, i: number) => <p key={i} style={{ fontSize: '12px', color: 'var(--color-text-2)', margin: '2px 0' }}>• {c}</p>)}</div>}
                            {insight.commonMistakes?.length > 0 && <div><p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>Common Mistakes</p>{insight.commonMistakes.map((m: string, i: number) => <p key={i} style={{ fontSize: '12px', color: '#FF3D71', margin: '2px 0' }}>• {m}</p>)}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {currentScreen === 'error' && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', padding: '32px 24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
              {error === 'No materials detected' ? 'No materials found' : 'Something went wrong'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-2)', marginBottom: '24px' }}>
              {error === 'No materials detected' ? "We couldn't detect any materials. Try a clearer photo or describe your materials instead." : error}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={backToSelection} style={{ padding: '12px 20px', backgroundColor: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'var(--color-text-2)', fontSize: '14px', cursor: 'pointer' }}>Back</button>
              <button onClick={tryAgain} style={{ padding: '12px 20px', background: 'linear-gradient(90deg, #6C3CE1, #FF3D71)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Try again</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
