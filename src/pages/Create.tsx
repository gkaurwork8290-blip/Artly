import { useState, useRef, type ChangeEvent } from 'react'
import { Image, PenLine, X, Plus, Camera, BookOpen } from 'lucide-react'

type InputMethod = 'upload' | 'camera' | 'describe' | 'quickscan' | null
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


export default function Create() {
  const [selectedMethod, setSelectedMethod] = useState<InputMethod>(null)
  const [inputData, setInputData] = useState<InputData>({ method: null })
  const [isScanning, setIsScanning] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<Screen>('selection')
  const [detectedMaterials, setDetectedMaterials] = useState<Material[]>([])
  const [manualMaterial, setManualMaterial] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [themeInput, setThemeInput] = useState('')
  const [showThemeInput, setShowThemeInput] = useState(false)
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null)
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [colourMatches, setColourMatches] = useState<any[]>([])
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
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

  const handleQuickScan = async () => {
    setIsScanning(true)
    setSelectedMethod('quickscan')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      // Simulate scanning process
      setTimeout(() => {
        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current?.videoWidth || 640
        canvas.height = videoRef.current?.videoHeight || 480
        const ctx = canvas.getContext('2d')
        if (ctx && videoRef.current) {
          ctx.drawImage(videoRef.current, 0, 0)
          const imageUrl = canvas.toDataURL('image/jpeg')
          setInputData({ image: imageUrl, method: 'quickscan' })
          setIsScanning(false)
          stopCamera()
        }
      }, 3000)
    } catch (error) {
      console.error('Quick scan failed:', error)
      setIsScanning(false)
      alert('Quick scan failed. Please check camera permissions.')
    }
  }

  const handleRetake = () => {
    setInputData({ method: selectedMethod })
    if (selectedMethod === 'camera') {
      handleCameraCapture()
    }
  }

  const detectMaterials = async () => {
    setCurrentScreen('detecting')
    setError(null)

    try {
      let requestBody: any = {}

      if (inputData.image) {
        // Convert image to base64 (remove data:image/jpeg;base64, prefix)
        requestBody.image = inputData.image.split(',')[1]
      } else if (inputData.description) {
        requestBody.text = inputData.description
      } else {
        throw new Error('No input data available')
      }

      const response = await fetch('/api/detect-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API request failed`)
      }

      const data = await response.json()
      const materials = data.materials

      // Validate materials array
      if (!Array.isArray(materials)) {
        throw new Error('Invalid response format')
      }

      // Check if materials array is empty
      if (materials.length === 0) {
        throw new Error('No materials detected')
      }

      setDetectedMaterials(materials)
      setCurrentScreen('confirmation')

    } catch (error) {
      console.error('Detection failed:', error)
      setError(error instanceof Error ? error.message : 'Detection failed')
      setCurrentScreen('error')
    }
  }

  const handleDetectMaterials = () => {
    detectMaterials()
  }

  const addManualMaterial = () => {
    if (manualMaterial.trim()) {
      const newMaterial: Material = {
        name: manualMaterial.trim(),
        category: 'other',
        confidence: 'manual'
      }
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
      const skillLevel = localStorage.getItem('artly_skill_level') || 'beginner'
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materials: detectedMaterials.map(m => m.name),
          skillLevel,
          theme: theme || undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'API request failed')
      }

      const data = await response.json()
      const ideas = data.ideas || []

      setIdeas(ideas)
    } catch (error) {
      console.error('Ideas generation failed:', error)
      setError(error instanceof Error ? error.message : 'Ideas generation failed')
      setCurrentScreen('error')
    }
  }

  
  const generatePalette = async () => {
    console.log('🎨 generatePalette called')
    console.log('📝 selectedIdea:', selectedIdea)
    console.log('🎨 detectedMaterials:', detectedMaterials)
    
    setCurrentScreen('palette')
    setError(null)

    const colourMaterials = filterColourMaterials(detectedMaterials)
    console.log('🎨 Colour materials:', colourMaterials)

    if (colourMaterials.length === 0) {
      console.log('❌ No colour materials detected')
      return
    }

    try {
      const requestBody = {
        materials: colourMaterials,
        ideaTitle: selectedIdea?.title || undefined,
        ideaSteps: selectedIdea?.steps || []
      }
      
      console.log('🚀 Sending request body:', requestBody)
      
      const response = await fetch('/api/generate-palette', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || 'API request failed')
      }

      const data = await response.json()
      console.log('✅ Palette generated successfully:', data)
      // Set colour matches for display
      if (data.colors && Array.isArray(data.colors)) {
        const matches = data.colors.map((color: any) => ({
          hex: color.hex,
          name: color.name,
          status: 'have' as const, // Default to have since it's from materials
          matchedMaterial: color.materialSource
        }))
        setColourMatches(matches)
      }
    } catch (error: unknown) {
      console.error('💥 Palette generation failed:', error)
      setError(error instanceof Error ? error.message : 'Palette generation failed')
      setCurrentScreen('error')
    }
  }

  const loadMaterialInsights = async () => {
    setLoadingInsights(true)
    try {
      const materials = detectedMaterials.map(m => m.name)
      const response = await fetch('/api/material-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ materials }),
      })

      if (!response.ok) {
        throw new Error('Failed to load material insights')
      }

      const insights = await response.json()
      console.log('Material insights loaded:', insights)
    } catch (error) {
      console.error('Error loading material insights:', error)
    } finally {
      setLoadingInsights(false)
    }
  }

  
  const filterColourMaterials = (materials: Material[]): string[] => {
  const colourMaterials = [
    'paint', 'watercolor', 'watercolour', 'acrylic', 'pastel', 'chalk', 
    'crayon', 'ink', 'dye', 'charcoal', 'colored pencil', 
    'marker', 'pressed flowers', 'pressed leaves', 'flowers', 'leaves',
    'pigment', 'oil paint', 'tempera', 'gouache', 'watercolor paint',
    'acrylic paint', 'oil paints', 'watercolors', 'coloured pencils'
  ]
  
  return materials
    .filter(m => colourMaterials.some(cm => 
      m.name.toLowerCase().includes(cm.toLowerCase())
    ))
    .map(m => m.name)
}

  const confirmMaterials = () => {
    generateIdeas()
  }

  const tryAgain = () => {
    setCurrentScreen('selection')
    setError(null)
    setDetectedMaterials([])
  }

  const backToSelection = () => {
    setCurrentScreen('selection')
    setSelectedMethod(null)
    setInputData({ method: null })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 py-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" style={{fontSize: 'var(--fs-display)'}}>
            What do you have?
          </h1>
          <p className="text-text-secondary" style={{fontSize: 'var(--fs-body)'}}>
            Show us your materials and we'll spark your creativity
          </p>
        </div>

        {/* Selection Screen */}
        {currentScreen === 'selection' && (
          <>
            {/* Input Methods Grid */}
            {!selectedMethod && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Upload Photo */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-surface border border-surface2 rounded-2xl p-8 cursor-pointer hover:bg-surface2 transition-all duration-200 group"
                >
                  <div className="text-center">
                    <Image size={40} className="mx-auto mb-4 text-text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-text-primary mb-2" style={{fontSize: 'var(--fs-h2)'}}>Upload Photo</h3>
                    <p className="text-text-secondary" style={{fontSize: 'var(--fs-body)'}}>Choose an image from your device</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Use Camera */}
                <div 
                  onClick={handleCameraCapture}
                  className="bg-surface border border-surface2 rounded-2xl p-8 cursor-pointer hover:bg-surface2 transition-all duration-200 group"
                >
                  <div className="text-center">
                    <Camera size={40} className="mx-auto mb-4 text-text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-text-primary mb-2" style={{fontSize: 'var(--fs-h2)'}}>Use Camera</h3>
                    <p className="text-text-secondary" style={{fontSize: 'var(--fs-body)'}}>Take a photo with your device</p>
                  </div>
                </div>

                {/* Describe It */}
                <div 
                  onClick={() => setSelectedMethod('describe')}
                  className="bg-surface border border-surface2 rounded-2xl p-8 cursor-pointer hover:bg-surface2 transition-all duration-200 group"
                >
                  <div className="text-center">
                    <PenLine size={40} className="mx-auto mb-4 text-text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-text-primary mb-2" style={{fontSize: 'var(--fs-h2)'}}>Describe It</h3>
                    <p className="text-text-secondary" style={{fontSize: 'var(--fs-body)'}}>Tell us what materials you have</p>
                  </div>
                </div>

                {/* Quick Scan */}
                <div 
                  onClick={handleQuickScan}
                  className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-8 cursor-pointer hover:shadow-lg hover:shadow-primary/25 transform hover:scale-105 transition-all duration-200 md:col-span-2"
                >
                  <div className="text-center">
                    <div className="mb-4" style={{fontSize: 'var(--fs-h2)'}}>â¡¡</div>
                    <h3 className="font-semibold mb-2" style={{fontSize: 'var(--fs-h2)'}}>Quick Scan</h3>
                    <p className="opacity-90" style={{fontSize: 'var(--fs-body)'}}>Snap your desk â get instant ideas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Method Content */}
            {selectedMethod === 'upload' && inputData.image && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="font-semibold text-text-primary mb-4" style={{fontSize: 'var(--fs-h1)'}}>Uploaded Image</h3>
                <img 
                  src={inputData.image} 
                  alt="Uploaded" 
                  className="w-full max-w-md mx-auto rounded-lg mb-6"
                />
                <div className="flex gap-4 justify-center flex-wrap gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Re-upload
                  </button>
                  <button
                    onClick={handleDetectMaterials}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Detect Materials
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {selectedMethod === 'camera' && !inputData.image && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="font-semibold text-text-primary mb-4" style={{fontSize: 'var(--fs-h1)'}}>Take a Photo</h3>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md mx-auto rounded-lg mb-6"
                />
                <div className="flex gap-4 justify-center flex-wrap gap-2">
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={takePhoto}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Capture
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'camera' && inputData.image && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="font-semibold text-text-primary mb-4" style={{fontSize: 'var(--fs-h1)'}}>Captured Photo</h3>
                <img 
                  src={inputData.image} 
                  alt="Captured" 
                  className="w-full max-w-md mx-auto rounded-lg mb-6"
                />
                <div className="flex gap-4 justify-center flex-wrap gap-2">
                  <button
                    onClick={handleRetake}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleDetectMaterials}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Detect Materials
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'describe' && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="font-semibold text-text-primary mb-4" style={{fontSize: 'var(--fs-h1)'}}>Describe Your Materials</h3>
                <textarea
                  value={inputData.description || ''}
                  onChange={(e) => setInputData({ ...inputData, description: e.target.value, method: 'describe' })}
                  placeholder="e.g. I have crimson acrylic paint, a flat brush, air dry clay and some canvas board..."
                  className="w-full h-32 p-4 bg-background border border-surface2 rounded-lg text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:border-primary mb-6"
                />
                <div className="flex gap-4 justify-center flex-wrap gap-2">
                  <button
                    onClick={backToSelection}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDetectMaterials}
                    disabled={!inputData.description?.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Detect Materials
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'quickscan' && isScanning && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="font-semibold text-text-primary mb-4" style={{fontSize: 'var(--fs-h1)'}}>Quick Scanning...</h3>
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg mb-6"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-50 rounded-lg p-4">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p>Scanning your materials...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'quickscan' && inputData.image && !isScanning && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-text-primary mb-4">Quick Scan Complete</h3>
                <img 
                  src={inputData.image} 
                  alt="Quick Scan" 
                  className="w-full max-w-md mx-auto rounded-lg mb-6"
                />
                <div className="flex gap-4 justify-center flex-wrap gap-2">
                  <button
                    onClick={handleQuickScan}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Scan Again
                  </button>
                  <button
                    onClick={handleDetectMaterials}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Detect Materials
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Detecting Screen */}
        {currentScreen === 'detecting' && (
          <div className="bg-surface border border-surface2 rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
            <h3 className="font-semibold text-text-primary mb-2" style={{fontSize: 'var(--fs-display)'}}>Analysing your materials...</h3>
            <p className="text-text-secondary" style={{fontSize: 'var(--fs-body)'}}>This usually takes a few seconds</p>
          </div>
        )}

        {/* Confirmation Screen */}
        {currentScreen === 'confirmation' && (
          <div className="bg-surface border border-surface2 rounded-2xl p-6">
            <h3 className="font-semibold text-text-primary mb-6" style={{fontSize: 'var(--fs-display)'}}>We found these materials</h3>
            
            {/* Material Chips */}
            <div className="flex flex-wrap gap-3 mb-6">
              {detectedMaterials.map((material, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-full"
                >
                  <span className="text-text-primary" style={{fontSize: 'var(--fs-body)'}}>{material.name}</span>
                  <button
                    onClick={() => removeMaterial(index)}
                    className="text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Material Input */}
            <div className="flex gap-3 mb-8 flex-wrap gap-2">
              <input
                type="text"
                value={manualMaterial}
                onChange={(e) => setManualMaterial(e.target.value)}
                placeholder="Add material..."
                className="flex-1 px-4 py-2 bg-background border border-surface2 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
                onKeyPress={(e) => e.key === 'Enter' && addManualMaterial()}
              />
              <button
                onClick={addManualMaterial}
                disabled={!manualMaterial.trim()}
                className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center flex-wrap gap-2">
              <button
                onClick={tryAgain}
                className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                style={{minWidth: '0', minHeight: '44px'}}
              >
                Try again
              </button>
              <button
                onClick={confirmMaterials}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                style={{minWidth: '0', minHeight: '44px'}}
              >
                Looks good!
              </button>
            </div>
          </div>
        )}

        {/* Ideas Screen */}
        {currentScreen === 'ideas' && (
          <div className="bg-surface border border-surface2 rounded-2xl p-6" style={{maxWidth: '100%', padding: '0 16px'}}>
            <div className="flex justify-between items-center mb-6 text-lg font-bold">
                <h3 className="font-semibold text-text-primary" style={{fontSize: 'var(--fs-h1)'}}>Creative Ideas for You</h3>
              <div className="flex gap-3 flex-wrap gap-2">
                {!showThemeInput ? (
                  <div className="flex gap-2 flex-wrap gap-2" style={{flexWrap: 'wrap', gap: '8px'}}>
                    <input
                      type="text"
                      value={themeInput}
                      onChange={(e) => setThemeInput(e.target.value)}
                      placeholder="e.g. calm, bold, nature..."
                      className="flex-1 px-4 py-2 bg-background border border-surface2 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => generateIdeas(themeInput)}
                      className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                    >
                      Apply Theme
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowThemeInput(true)}
                    className="px-4 py-2 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                  >
                    Inspire Me
                  </button>
                )}
              </div>
            </div>

            {ideas.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-text-secondary">Sparking your creativity...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ideas.map((idea, index) => (
                  <div key={index} className="bg-surface border border-surface2 rounded-xl p-6" style={{width: '100%'}}>
                    <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white" style={{fontSize: 'var(--fs-h2)'}}>{idea.title}</h4>
                        <span className={`px-3 py-1 rounded-full font-medium ${
                          idea.difficulty === 'beginner' ? 'bg-green-500 text-white' :
                          idea.difficulty === 'intermediate' ? 'bg-yellow-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {idea.difficulty}
                        </span>
                      </div>
                      <div className="relative">
                        <img 
                          src={`https://picsum.photos/seed/${encodeURIComponent(idea.title)}/400/200`}
                          alt={idea.title}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                          style={{ borderRadius: '12px 12px 0 0' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded font-medium" style={{ borderRadius: '8px', padding: '2px 8px', fontSize: 'var(--fs-micro)' }}>
                          Reference
                        </div>
                      </div>
                    </div>
                    <p className="text-text-secondary mb-3" style={{fontSize: 'var(--fs-body)'}}>{idea.description}</p>
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                      <span className="text-text-secondary" style={{fontSize: 'var(--fs-caption)'}}>{idea.estimatedTime}</span>
                      <button
                        onClick={() => setExpandedIdea(expandedIdea === index ? null : index)}
                        className="text-primary hover:text-primary/80 transition-colors" style={{fontSize: 'var(--fs-caption)'}}>
                        {expandedIdea === index ? 'Hide steps' : 'See steps'}
                      </button>
                    </div>
                    {expandedIdea === index && (
                      <div className="bg-surface2 rounded-lg p-4 mt-3">
                        <h5 className="font-medium text-text-primary mb-2" style={{fontSize: 'var(--fs-h2)'}}>Steps:</h5>
                        <ol className="list-decimal list-inside space-y-2">
                          {idea.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="text-text-secondary" style={{fontSize: 'var(--fs-body)'}}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedIdea(idea)
                        setCurrentScreen('palette')
                        generatePalette()
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all mt-4"
                    >
                      Choose this idea
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4 justify-center mt-8 flex-wrap gap-2">
              <button
                onClick={tryAgain}
                className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                style={{minWidth: '0', minHeight: '44px'}}
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Palette Screen */}
        {currentScreen === 'palette' && (
          <div className="bg-surface border border-surface2 rounded-2xl p-6">
            {/* Confirmation Banner */}
            {selectedIdea && (
              <div className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <p className="text-text-primary" style={{fontSize: 'var(--fs-body)'}}>
                      Creating based on: <span className="font-semibold">{selectedIdea.title}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedIdea(null)
                      setCurrentScreen('ideas')
                    }}
                    className="text-purple-500 hover:text-purple-600 font-medium transition-colors" style={{fontSize: 'var(--fs-caption)'}}>
                    Change
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-text-primary" style={{fontSize: 'var(--fs-display)'}}>
                {selectedIdea ? `Colour Palette for ${selectedIdea.title}` : 'Your Color Palette'}
              </h3>
            </div>

            {/* Colour Extraction Display */}
            {selectedIdea && (
              <div className="bg-surface2 rounded-xl p-6">
                <h4 className="font-semibold text-text-primary mb-4" style={{fontSize: 'var(--fs-h2)'}}>Colours from your inspiration</h4>
                
                <div className="flex gap-6 items-start flex-wrap gap-2">
                  {/* Reference Image */}
                  <div className="flex-shrink-0">
                    <img 
                      src={`https://picsum.photos/seed/${encodeURIComponent(selectedIdea.title)}/120/80`}
                      alt={selectedIdea.title}
                      className="w-30 h-20 rounded-lg object-cover"
                      style={{ width: '120px', height: '80px' }}
                    />
                  </div>
                  
                  {/* Colour Swatches */}
                  <div className="flex-1">
                    {colourMatches.length === 0 ? (
                      <div className="text-center py-8">
                        {filterColourMaterials(detectedMaterials).length === 0 ? (
                          <>
                            <div className="text-text-secondary mb-3" style={{fontSize: 'var(--fs-body)'}}>
                              No colour materials detected — add paints or pigments to see a palette
                            </div>
                            <button
                              onClick={() => setCurrentScreen('ideas')}
                              className="px-4 py-2 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                            >
                              Back to materials
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                            <p className="text-text-secondary" style={{fontSize: 'var(--fs-caption)'}}>Generating palette...</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-3 mb-4">
                          {colourMatches.map((match, index) => (
                            <div key={index} className="relative group">
                              <div 
                                className="w-12 h-12 rounded-full border-2 border-surface3 transition-all"
                                style={{ 
                                  backgroundColor: match.hex,
                                  ...(match.status === 'need' ? { 
                                    borderStyle: 'dashed',
                                    opacity: 0.7 
                                  } : {})
                                }}
                                title={match.matchedMaterial ? `You have: ${match.matchedMaterial}` : match.name}
                              />
                              
                              {/* Badge */}
                              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                match.status === 'have' 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-purple-500 text-white'
                              }`}>
                                {match.status === 'have' ? '✓' : '+'}
                              </div>
                              
                              {/* Tooltip */}
                              {match.matchedMaterial && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  {match.matchedMaterial}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Legend */}
                        <div className="flex items-center gap-4 text-text-secondary flex-wrap gap-2" style={{fontSize: 'var(--fs-caption)'}}>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white" style={{fontSize: 'var(--fs-micro)'}}>✓</span>
                            </div>
                            <span>You have this</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-white" style={{fontSize: 'var(--fs-micro)'}}>+</span>
                            </div>
                            <span>Add to your kit</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center mt-8 flex-wrap gap-2">
              <button
                onClick={() => generatePalette()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                style={{minWidth: '0', minHeight: '44px'}}
              >
                Mixing Guide
              </button>
              {detectedMaterials.length > 0 && (
                <button
                  onClick={loadMaterialInsights}
                  disabled={loadingInsights}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                  style={{minWidth: '0', minHeight: '44px'}}
                >
                  <BookOpen className="w-4 h-4" />
                  {loadingInsights ? 'Analysing your materials...' : 'Material Insights'}
                </button>
              )}
              <button
                onClick={tryAgain}
                className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                style={{minWidth: '0', minHeight: '44px'}}
              >
                Start over
              </button>
            </div>
          </div>
        )}


        {/* Error Screen */}
        {currentScreen === 'error' && (
          <div className="bg-surface border border-surface2 rounded-2xl p-6 text-center">
            <div className="text-lg mb-4" style={{fontSize: 'var(--fs-display)'}}>â ï¸</div>
            <h3 className="font-semibold text-text-primary mb-2" style={{fontSize: 'var(--fs-h1)'}}>
              {error === 'No materials detected' ? 'No materials found' : 'Something went wrong'}
            </h3>
            <p className="text-text-secondary mb-6" style={{fontSize: 'var(--fs-body)'}}>
              {error === 'No materials detected' 
                ? "We couldn't detect any materials. Try a clearer photo or describe your materials instead."
                : error
              }
            </p>
            <div className="flex gap-4 justify-center flex-wrap gap-2">
              {error === 'No materials detected' ? (
                <button
                  onClick={tryAgain}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                  style={{minWidth: '0', minHeight: '44px'}}
                >
                  Try again
                </button>
              ) : (
                <>
                  <button
                    onClick={backToSelection}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Back to selection
                  </button>
                  <button
                    onClick={tryAgain}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                    style={{minWidth: '0', minHeight: '44px'}}
                  >
                    Try again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
