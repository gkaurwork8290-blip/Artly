import { Home, Sparkles, BookOpen, User } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { name: 'Home', icon: Home, href: '/home' },
  { name: 'Create', icon: Sparkles, href: '/create' },
  { name: 'Journal', icon: BookOpen, href: '/journal' },
  { name: 'Profile', icon: User, href: '/profile' },
]

export default function SideNav() {
  const location = useLocation()
  const { user } = useAuth()

  // Define colors for each tab
  const getIconColor = (itemName: string, isActive: boolean) => {
    if (isActive) {
      switch(itemName) {
        case 'Home': return '#6C3CE1'
        case 'Create': return '#6C3CE1'
        case 'Journal': return '#1D9E75'
        case 'Profile': return '#EF9F27'
        default: return '#6C3CE1'
      }
    }
    return '#5a5a7a'
  }

  const getActiveBg = (itemName: string, isActive: boolean) => {
    if (!isActive) return 'transparent'
    const color = getIconColor(itemName, isActive)
    // Convert hex to rgba with 15% opacity
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, 0.15)`
  }

  return (
    <>
      {/* Desktop Side Navigation - only visible on screens 768px and wider */}
      <nav 
        className="hidden md:flex fixed left-0 top-0 h-screen w-16 flex-col items-center py-4 z-40"
        style={{ 
          background: 'var(--color-surface-2, #0a0a14)',
          borderRight: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Logo Mark */}
        <div 
          className="mb-8"
          style={{ 
            width: '32px', 
            height: '32px', 
            background: '#6C3CE1', 
            borderRadius: '8px',
            margin: '16px auto'
          }}
        />

        {/* Navigation Items */}
        <div className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            const isProfileItem = item.name === 'Profile'
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center justify-center rounded-lg transition-all duration-200"
                style={{ 
                  width: '48px', 
                  height: '48px',
                  backgroundColor: getActiveBg(item.name, isActive),
                  borderRadius: '10px'
                }}
              >
                <div className="relative">
                  <Icon size={24} style={{ color: getIconColor(item.name, isActive) }} />
                  {/* Show dot on Profile tab when user is NOT signed in */}
                  {isProfileItem && !user && (
                    <div 
                      className="absolute top-0 right-0 w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#FF3D71' }}
                    ></div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
