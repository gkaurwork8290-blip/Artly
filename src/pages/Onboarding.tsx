import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout, Palette, Star, Lightbulb, ArrowRight, Check, Paintbrush } from 'lucide-react'
import { Analytics } from '../lib/analytics'

const skills = [
  { id: 'beginner', icon: <Sprout size={28} color="#6C3CE1" strokeWidth={1.5} />, title: 'Beginner', subtitle: 'New to art or just exploring', description: "I'm learning the basics and trying different things." },
  { id: 'intermediate', icon: <Palette size={28} color="#6C3CE1" strokeWidth={1.5} />, title: 'Intermediate', subtitle: 'Comfortable with basics, exploring styles', description: "I know the basics and I'm exploring techniques and styles." },
  { id: 'advanced', icon: <Star size={28} color="#6C3CE1" strokeWidth={1.5} />, title: 'Advanced', subtitle: 'Confident artist, refining your craft', description: "I'm experienced and focused on improving my craft." },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)

  const handleContinue = () => {
    if (selected) {
      localStorage.setItem('artly_skill', selected)
      Analytics.onboardingCompleted(selected)
    }
    localStorage.setItem('artly_onboarding_complete', 'true')
    navigate('/create')
  }

  const handleSkip = () => {
    Analytics.onboardingSkipped()
    localStorage.setItem('artly_onboarding_complete', 'true')
    navigate('/create')
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(24px, 5vw, 48px) 16px 32px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <img src="/logo.png" alt="artly" style={{ width: 40, height: 40, objectFit: 'contain', mixBlendMode: 'screen' }} />
          <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>artly</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            <h1 style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: '800', color: 'var(--color-text)', margin: 0, lineHeight: 1.2 }}>Where are you in your art journey?</h1>
            <Paintbrush size={28} color="#6C3CE1" strokeWidth={1.5} style={{ flexShrink: 0 }} />
          </div>
          <p style={{ fontSize: 'clamp(13px, 3vw, 15px)', color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>This helps us tailor ideas and palettes that match your level.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {skills.map((skill) => {
            const isSelected = selected === skill.id
            return (
              <div key={skill.id} onClick={() => { setSelected(skill.id); Analytics.skillSelected(skill.id) }} style={{ backgroundColor: isSelected ? 'rgba(108, 60, 225, 0.08)' : 'var(--color-surface)', border: isSelected ? '1.5px solid #6C3CE1' : '1.5px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'border 0.15s, background 0.15s', boxShadow: isSelected ? '0 0 0 1px rgba(108,60,225,0.3)' : 'none' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: isSelected ? 'rgba(108,60,225,0.15)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{skill.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 'clamp(15px, 3.5vw, 17px)', fontWeight: '700', color: 'var(--color-text)' }}>{skill.title}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 'clamp(11px, 2.5vw, 13px)', color: '#6C3CE1', fontWeight: '500' }}>{skill.subtitle}</p>
                  <p style={{ margin: 0, fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--color-text-2)', lineHeight: 1.4 }}>{skill.description}</p>
                </div>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, border: isSelected ? '2px solid #6C3CE1' : '2px solid rgba(255,255,255,0.2)', backgroundColor: isSelected ? '#6C3CE1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Lightbulb size={16} color="var(--color-text-3)" strokeWidth={1.5} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>You can change this anytime in Settings.</span>
        </div>

        <button onClick={handleContinue} style={{ width: '100%', height: '52px', background: 'linear-gradient(90deg, #6C3CE1 0%, #FF6B35 100%)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: 'clamp(14px, 3vw, 16px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px', opacity: selected ? 1 : 0.5 }}>
          Continue <ArrowRight size={18} color="white" strokeWidth={2.5} />
        </button>

        <button onClick={handleSkip} style={{ background: 'none', border: 'none', color: '#6C3CE1', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', width: '100%' }}>
          Skip for now
        </button>
      </div>
    </div>
  )
}
