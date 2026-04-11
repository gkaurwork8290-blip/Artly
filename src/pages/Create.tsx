import { useState, useRef, type ChangeEvent } from 'react'
import { Image, PenLine, X, Plus } from 'lucide-react'

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

type Screen = 'selection' | 'detecting' | 'confirmation' | 'error'

export default function Create() {
  const [selectedMethod, setSelectedMethod] = useState<InputMethod>(null)
  const [inputData, setInputData] = useState<InputData>({ method: null })
  const [isScanning, setIsScanning] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<Screen>('selection')
  const [detectedMaterials, setDetectedMaterials] = useState<Material[]>([])
  const [manualMaterial, setManualMaterial] = useState('')
  const [error, setError] = useState<string | null>(null)
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
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
      if (!apiKey) {
        throw new Error('API key not configured')
      }

      let messages: any[] = []

      if (inputData.image) {
        // Convert image to base64 (remove data:image/jpeg;base64, prefix)
        const base64Image = inputData.image.split(',')[1]
        
        messages = [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: 'Analyse this image and identify the art materials visible.'
              }
            ]
          }
        ]
      } else if (inputData.description) {
        messages = [
          {
            role: 'user',
            content: `Analyse this description of art materials: "${inputData.description}"`
          }
        ]
      } else {
        throw new Error('No input data available')
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          system: 'You are an art materials expert. Analyse the input and return ONLY a valid JSON array. Each item: { name: string, category: string, confidence: string }. Categories: paint, brush, paper, canvas, clay, ink, pencil, marker, tool, other. No other text, just the JSON array.',
          messages
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const content = data.content[0]?.text

      if (!content) {
        throw new Error('No response content received')
      }

      // Parse JSON response
      let materials: Material[]
      try {
        materials = JSON.parse(content)
      } catch (parseError) {
        throw new Error('Failed to parse API response')
      }

      // Validate materials array
      if (!Array.isArray(materials)) {
        throw new Error('Invalid response format')
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

  const confirmMaterials = () => {
    // Store materials in state for next step
    console.log('Confirmed materials:', detectedMaterials)
    // This would navigate to the next step in the flow
    alert('Materials confirmed! Ready for next step.')
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            What do you have?
          </h1>
          <p className="text-xl text-text-secondary">
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
                    <h3 className="text-xl font-semibold text-text-primary mb-2">Upload Photo</h3>
                    <p className="text-text-secondary">Choose an image from your device</p>
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
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">ð ÷</div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">Use Camera</h3>
                    <p className="text-text-secondary">Take a photo with your device</p>
                  </div>
                </div>

                {/* Describe It */}
                <div 
                  onClick={() => setSelectedMethod('describe')}
                  className="bg-surface border border-surface2 rounded-2xl p-8 cursor-pointer hover:bg-surface2 transition-all duration-200 group"
                >
                  <div className="text-center">
                    <PenLine size={40} className="mx-auto mb-4 text-text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">Describe It</h3>
                    <p className="text-text-secondary">Tell us what materials you have</p>
                  </div>
                </div>

                {/* Quick Scan */}
                <div 
                  onClick={handleQuickScan}
                  className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-8 cursor-pointer hover:shadow-lg hover:shadow-primary/25 transform hover:scale-105 transition-all duration-200 md:col-span-2"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">â¡¡</div>
                    <h3 className="text-xl font-semibold mb-2">Quick Scan</h3>
                    <p className="opacity-90">Snap your desk â get instant ideas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Method Content */}
            {selectedMethod === 'upload' && inputData.image && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Uploaded Image</h3>
                <img 
                  src={inputData.image} 
                  alt="Uploaded" 
                  className="w-full max-w-md mx-auto rounded-lg mb-6"
                />
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                  >
                    Re-upload
                  </button>
                  <button
                    onClick={handleDetectMaterials}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
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
                <h3 className="text-xl font-semibold text-text-primary mb-4">Take a Photo</h3>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md mx-auto rounded-lg mb-6"
                />
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={takePhoto}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                  >
                    Capture
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'camera' && inputData.image && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Captured Photo</h3>
                <img 
                  src={inputData.image} 
                  alt="Captured" 
                  className="w-full max-w-md mx-auto rounded-lg mb-6"
                />
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleRetake}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleDetectMaterials}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
                  >
                    Detect Materials
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'describe' && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Describe Your Materials</h3>
                <textarea
                  value={inputData.description || ''}
                  onChange={(e) => setInputData({ ...inputData, description: e.target.value, method: 'describe' })}
                  placeholder="Describe the art materials you have..."
                  className="w-full h-32 p-4 bg-background border border-surface2 rounded-lg text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:border-primary mb-6"
                />
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={backToSelection}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDetectMaterials}
                    disabled={!inputData.description?.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Detect Materials
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'quickscan' && isScanning && (
              <div className="bg-surface border border-surface2 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Quick Scanning...</h3>
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
                <h3 className="text-xl font-semibold text-text-primary mb-4">Quick Scan Complete</h3>
                <img 
                  src={inputData.image} 
                  alt="Quick Scan" 
                  className="w-full max-w-md mx-auto rounded-lg mb-6"
                />
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleQuickScan}
                    className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
                  >
                    Scan Again
                  </button>
                  <button
                    onClick={handleDetectMaterials}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
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
            <h3 className="text-2xl font-semibold text-text-primary mb-2">Analysing your materials...</h3>
            <p className="text-text-secondary">This usually takes a few seconds</p>
          </div>
        )}

        {/* Confirmation Screen */}
        {currentScreen === 'confirmation' && (
          <div className="bg-surface border border-surface2 rounded-2xl p-6">
            <h3 className="text-2xl font-semibold text-text-primary mb-6">We found these materials</h3>
            
            {/* Material Chips */}
            <div className="flex flex-wrap gap-3 mb-6">
              {detectedMaterials.map((material, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-full"
                >
                  <span className="text-text-primary">{material.name}</span>
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
            <div className="flex gap-3 mb-8">
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
            <div className="flex gap-4 justify-center">
              <button
                onClick={tryAgain}
                className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={confirmMaterials}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                Looks good!
              </button>
            </div>
          </div>
        )}

        {/* Error Screen */}
        {currentScreen === 'error' && (
          <div className="bg-surface border border-surface2 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">â ï¸</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h3>
            <p className="text-text-secondary mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={backToSelection}
                className="px-6 py-3 bg-surface2 text-text-primary rounded-lg hover:bg-surface3 transition-colors"
              >
                Back to selection
              </button>
              <button
                onClick={tryAgain}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
