// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Heart, Clock, Layers, BarChart2,
  ChevronDown, ChevronUp, Lightbulb, ArrowRight,
  ArrowLeft, Paintbrush2, Edit2, CheckCircle2
} from 'lucide-react'
import { Analytics } from '../lib/analytics'

export default function Project() {
  const navigate = useNavigate()
  const [idea, setIdea] = useState(null)
  const [materials, setMaterials] = useState([])
  const [activeStep, setActiveStep] = useState(0)
  const [showAllSteps, setShowAllSteps] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('artly_active_idea')
    const storedMats = localStorage.getItem('artly_detected_materials')
    if (stored) { try { setIdea(JSON.parse(stored)) } catch {} }
    if (storedMats) { try { setMaterials(JSON.parse(storedMats)) } catch {} }
  }, [])

  const handleNextStep = (currentStep: number, total: number) => {
    Analytics.stepCompleted(currentStep + 1, total, idea?.title || '')
    if (currentStep < total - 1) setActiveStep(i => i + 1)
    else navigate('/journal')
  }

  if (!idea) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--color-text-2)', fontSize: 15 }}>No active project found.</p>
        <button onClick={() => navigate('/create')} style={{ padding: '12px 24px', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Start a project</button>
      </div>
    )
  }

  const steps = (idea.steps || []).map(s => typeof s === 'string' ? { title: s, description: '', tip: '' } : s)
  const totalSteps = steps.length
  const current = steps[activeStep] || {}
  const diffColor = { beginner: '#1D9E75', intermediate: '#EF9F27', advanced: '#FF3D71' }[idea.difficulty] || '#1D9E75'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 8px' }}>
          <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={20} color="var(--color-text)" />
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2].map(i => (<div key={i} style={{ height: 4, borderRadius: 2, background: i <= 1 ? '#6C3CE1' : 'rgba(255,255,255,0.15)', width: i <= 1 ? 24 : 16 }} />))}
          </div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
          <h1 style={{ fontSize: 'clamp(22px,5vw,30px)', fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(90deg,#6C3CE1,#FF3D71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>{idea.title}</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0 }}>Let's create something beautiful 🌿</p>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: `${diffColor}20`, border: `1px solid ${diffColor}` }}>
            <BarChart2 size={12} color={diffColor} />
            <span style={{ fontSize: 12, fontWeight: 700, color: diffColor }}>{idea.difficulty?.charAt(0).toUpperCase() + idea.difficulty?.slice(1)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(239,159,39,0.12)', border: '1px solid #EF9F27' }}>
            <Clock size={12} color="#EF9F27" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#EF9F27' }}>{idea.estimatedTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(108,60,225,0.12)', border: '1px solid #6C3CE1' }}>
            <Layers size={12} color="#6C3CE1" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6C3CE1' }}>{totalSteps} Steps</span>
          </div>
          <button onClick={() => setShowAllSteps(s => !s)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600 }}>
            View all steps {showAllSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 18, marginBottom: 16, border: '1px solid rgba(108,60,225,0.2)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6C3CE1', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step {activeStep + 1} of {totalSteps}</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 10px', lineHeight: 1.2 }}>{current.title}</h2>
          {current.description && <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 14px', lineHeight: 1.55 }}>{current.description}</p>}
          {current.tip && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(239,159,39,0.1)', border: '1px solid rgba(239,159,39,0.25)', borderRadius: 12, padding: '10px 12px', marginBottom: 16 }}>
              <Lightbulb size={15} color="#EF9F27" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#EF9F27', margin: 0, lineHeight: 1.5 }}><strong>Tip:</strong> {current.tip}</p>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <button onClick={() => setActiveStep(i => Math.max(0, i - 1))} disabled={activeStep === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: activeStep === 0 ? 'var(--color-text-3)' : 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: activeStep === 0 ? 'not-allowed' : 'pointer', opacity: activeStep === 0 ? 0.4 : 1 }}>
              <ArrowLeft size={15} /> Previous
            </button>
            <div style={{ display: 'flex', gap: 5 }}>
              {steps.map((_, i) => (<button key={i} onClick={() => setActiveStep(i)} style={{ width: i === activeStep ? 18 : 7, height: 7, borderRadius: 4, background: i === activeStep ? '#6C3CE1' : i < activeStep ? '#6C3CE180' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.25s' }} />))}
            </div>
            <button onClick={() => handleNextStep(activeStep, totalSteps)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: activeStep < totalSteps - 1 ? 'linear-gradient(90deg,#6C3CE1,#FF3D71)' : 'linear-gradient(90deg,#1D9E75,#6C3CE1)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {activeStep < totalSteps - 1 ? <>Next step <ArrowRight size={15} /></> : <>Done <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>

        <button onClick={() => navigate('/journal')} style={{ width: '100%', padding: '15px', borderRadius: 14, background: 'linear-gradient(90deg, #1D9E75 0%, #6C3CE1 100%)', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <span>Journal my result</span> <ArrowRight size={18} />
        </button>

        {showAllSteps && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 18, marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 14px' }}>All steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {steps.map((step, i) => {
                const isActive = i === activeStep
                const isDone = i < activeStep
                return (
                  <div key={i}>
                    <button onClick={() => setActiveStep(i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: isActive ? 'rgba(108,60,225,0.1)' : 'transparent', border: isActive ? '1px solid rgba(108,60,225,0.25)' : '1px solid transparent', borderRadius: 14, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: isActive || isDone ? '#6C3CE1' : 'rgba(108,60,225,0.15)', border: isActive || isDone ? 'none' : '1.5px solid rgba(108,60,225,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isDone ? <CheckCircle2 size={16} color="#fff" /> : <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#fff' : '#6C3CE1' }}>{i + 1}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px' }}>{step.title}</p>
                        {step.description && <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.description}</p>}
                      </div>
                      {isActive ? <span style={{ fontSize: 10, fontWeight: 700, color: '#6C3CE1', background: 'rgba(108,60,225,0.15)', borderRadius: 20, padding: '3px 8px', flexShrink: 0 }}>Current</span>
                        : isDone ? <CheckCircle2 size={16} color="#1D9E75" style={{ flexShrink: 0 }} />
                        : <span style={{ fontSize: 10, color: 'var(--color-text-3)', flexShrink: 0 }}>—</span>}
                    </button>
                    {i < steps.length - 1 && <div style={{ width: 2, height: 8, background: 'rgba(108,60,225,0.2)', margin: '0 0 0 22px' }} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {materials.length > 0 && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 18, marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(108,60,225,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Paintbrush2 size={14} color="#9b7ff0" /></div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Your materials</span>
              </div>
              <button onClick={() => navigate('/create')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#6C3CE1', fontSize: 13, fontWeight: 600 }}>
                <Edit2 size={13} color="#6C3CE1" /> Edit
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {materials.map((m, i) => (<span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'rgba(108,60,225,0.1)', border: '1px solid rgba(108,60,225,0.2)', borderRadius: 20, fontSize: 12, color: 'var(--color-text)' }}><Paintbrush2 size={10} color="#9b7ff0" /> {m.name || m}</span>))}
            </div>
          </div>
        )}

        {idea.palette && idea.palette.length > 0 && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 18, marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(108,60,225,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Paintbrush2 size={14} color="#9b7ff0" /></div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Colour Palette</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              {idea.palette.map((c, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: c.hex, border: '1px solid rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: 9, color: 'var(--color-text-3)', textAlign: 'center', maxWidth: 52, lineHeight: 1.2 }}>{c.name}</span>
                </div>
              ))}
            </div>
            {idea.mixHint && <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.6 }}>{idea.mixHint}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
