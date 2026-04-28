import { Home, Plus, Clock, BookOpen, User } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { name: 'Home', icon: Home, href: '/home' },
  { name: 'Create', icon: Plus, href: '/create' },
  { name: 'History', icon: Clock, href: '/history' },
  { name: 'Journal', icon: BookOpen, href: '/journal' },
  { name: 'Profile', icon: User, href: '/profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface2 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          const isProfileItem = item.name === 'Profile'
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="relative">
                <Icon size={20} className="mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
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
