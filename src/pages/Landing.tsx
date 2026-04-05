import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background abstract shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary to-tertiary rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-secondary to-primary rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-tertiary to-success rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
          🎨 Artly
        </h1>
        
        <p className="text-xl md:text-2xl text-text-secondary mb-12 font-medium">
          Discover what you can create — starting with what you have
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/create"
            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/25 transform hover:scale-105 transition-all duration-200"
          >
            Get Started
          </Link>
          
          <Link
            to="/profile"
            className="px-8 py-4 text-text-primary hover:text-white font-medium transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
