import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 py-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent" style={{fontSize: 'var(--fs-display)'}}>
            Welcome back! 🎨
          </h1>
          <p className="text-text-secondary" style={{fontSize: 'var(--fs-body)'}}>
            What will you create today?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <Link
            to="/create"
            className="p-6 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-primary/25 transform hover:scale-105 transition-all duration-200 text-center"
          >
            <div className="mb-2" style={{fontSize: 'var(--fs-h2)'}}>✨</div>
            <div style={{fontSize: 'var(--fs-h1)'}}>Start Creating</div>
          </Link>
          
          <Link
            to="/create"
            className="p-6 bg-surface border border-surface2 text-text-primary font-semibold rounded-2xl hover:bg-surface2 transform hover:scale-105 transition-all duration-200 text-center"
          >
            <div className="mb-2" style={{fontSize: 'var(--fs-h2)'}}>📸</div>
            <div style={{fontSize: 'var(--fs-h1)'}}>Quick Scan</div>
            <div className="mt-1 text-text-secondary" style={{fontSize: 'var(--fs-caption)'}}>Quick Mode</div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-surface2 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-text-secondary mb-1" style={{fontSize: 'var(--fs-caption)'}}>Sessions Created</div>
                <div className="font-bold text-text-primary" style={{fontSize: 'var(--fs-display)'}}>0</div>
              </div>
              <div style={{fontSize: 'var(--fs-display)'}}>🎨</div>
            </div>
          </div>
          
          <div className="bg-surface border border-surface2 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-text-secondary mb-1" style={{fontSize: 'var(--fs-caption)'}}>Journal Entries</div>
                <div className="font-bold text-text-primary" style={{fontSize: 'var(--fs-display)'}}>0</div>
              </div>
              <div style={{fontSize: 'var(--fs-display)'}}>📖</div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-surface border border-surface2 rounded-2xl p-6">
          <h2 className="font-semibold text-text-primary mb-4" style={{fontSize: 'var(--fs-h1)'}}>Recent Sessions</h2>
          <div className="text-center py-8">
            <div className="mb-4" style={{fontSize: 'var(--fs-display)'}}>🎨</div>
            <p className="text-text-secondary" style={{fontSize: 'var(--fs-body)'}}>
              No sessions yet — start creating!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
