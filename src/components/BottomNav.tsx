import { Home, Sparkles, BookOpen, User } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { name: 'Home', icon: Home, href: '/home' },
  { name: 'Create', icon: Sparkles, href: '/create' },
  { name: 'Journal', icon: BookOpen, href: '/journal' },
  { name: 'Profile', icon: User, href: '/profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface2 px-4 py-2 z-50" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          const isProfileItem = item.name === 'Profile'
          
          // Define colors for each tab
          const getIconColor = () => {
            if (isActive) {
              switch(item.name) {
                case 'Home': return '#6C3CE1'
                case 'Create': return '#6C3CE1'
                case 'Journal': return '#1D9E75'
                case 'Profile': return '#EF9F27'
                default: return '#6C3CE1'
              }
            }
            return '#5a5a7a'
          }

          const getActiveBg = () => {
            if (!isActive) return 'transparent'
            const color = getIconColor()
            // Convert hex to rgba with 15% opacity
            const r = parseInt(color.slice(1, 3), 16)
            const g = parseInt(color.slice(3, 5), 16)
            const b = parseInt(color.slice(5, 7), 16)
            return `rgba(${r}, ${g}, ${b}, 0.15)`
          }
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className="flex flex-col items-center justify-center rounded-lg transition-all duration-200"
              style={{ minHeight: '48px', backgroundColor: getActiveBg(), borderRadius: '8px', padding: '4px 10px' }}
            >
              <div className="relative">
                <Icon size={20} className="mb-1" style={{ color: getIconColor() }} />
                <span className="font-medium" style={{ fontSize: 'var(--fs-micro)', color: getIconColor() }}>{item.name}</span>
                {/* Show dot on Profile tab when user is NOT signed in */}
                {isProfileItem && !user && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-[#FF3D71] rounded-full"></div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
