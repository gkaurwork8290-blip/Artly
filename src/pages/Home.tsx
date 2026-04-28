import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 py-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
            Welcome back! 🎨
          </h1>
          <p className="text-xl text-text-secondary">
            What will you create today?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <Link
            to="/create"
            className="p-6 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-primary/25 transform hover:scale-105 transition-all duration-200 text-center"
          >
            <div className="text-2xl mb-2">✨</div>
            <div className="text-xl">Start Creating</div>
          </Link>
          
          <Link
            to="/create"
            className="p-6 bg-surface border border-surface2 text-text-primary font-semibold rounded-2xl hover:bg-surface2 transform hover:scale-105 transition-all duration-200 text-center"
          >
            <div className="text-2xl mb-2">📸</div>
            <div className="text-xl">Quick Scan</div>
            <div className="text-sm text-text-secondary mt-1">Quick Mode</div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface border border-surface2 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-text-secondary mb-1">Sessions Created</div>
                <div className="text-3xl font-bold text-text-primary">0</div>
              </div>
              <div className="text-3xl">🎨</div>
            </div>
          </div>
          
          <div className="bg-surface border border-surface2 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-text-secondary mb-1">Journal Entries</div>
                <div className="text-3xl font-bold text-text-primary">0</div>
              </div>
              <div className="text-3xl">📖</div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-surface border border-surface2 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Sessions</h2>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎨</div>
            <p className="text-text-secondary">
              No sessions yet — start creating!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
