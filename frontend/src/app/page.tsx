import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen -mt-16">
      {/* Hero Section with Purple Gradient */}
      <section className="relative bg-gradient-purple min-h-[90vh] flex items-center overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Message icon */}
          <div className="absolute top-32 right-[20%] animate-float">
            <div className="w-12 h-12 bg-violet-400/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
          </div>
          {/* Lightning icon */}
          <div className="absolute top-40 right-[10%] animate-float-delayed">
            <div className="w-10 h-10 bg-yellow-400/40 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
              </svg>
            </div>
          </div>
          {/* Lightbulb icon */}
          <div className="absolute top-48 left-[15%] animate-float">
            <div className="w-10 h-10 bg-yellow-400/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
              </svg>
            </div>
          </div>
          {/* Checkmark icon */}
          <div className="absolute bottom-40 right-[25%] animate-float-delayed">
            <div className="w-10 h-10 bg-green-400/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </div>
          {/* Paper plane icon */}
          <div className="absolute top-60 right-[5%] animate-float">
            <div className="w-8 h-8 bg-cyan-400/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-white pt-16 lg:pt-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Know Your Fit.
                <br />
                <span className="text-yellow-400">Land Your Dream Role.</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-10 leading-relaxed">
                See exactly how your skills stack up against any job.
                <br />
                Get a personalized roadmap to close the gap.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/login">
                  <Button variant="outline-dark" size="lg" rightIcon className="w-full sm:w-auto">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="yellow" size="lg" rightIcon className="w-full sm:w-auto">
                    Create Your Free Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side - App mockup */}
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* Main card mockup */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-violet-600 font-bold text-lg">SKILLBRIDGE</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-violet-400 to-violet-600 rounded-full"></div>
                    </div>
                  </div>

                  {/* Job card preview */}
                  <div className="bg-gray-50 rounded-2xl p-5 mb-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">G</div>
                      <div>
                        <p className="font-semibold text-gray-900">Google</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Full-Time</span>
                      <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">Hybrid</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Software Engineer, Cloud</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <span>📍</span> Mountain View, CA
                      </p>
                      <p className="flex items-center gap-2">
                        <span>💰</span> $140,000 - $200,000
                      </p>
                    </div>
                  </div>

                  {/* Match indicator */}
                  <div className="flex items-center justify-between bg-green-50 rounded-xl p-4">
                    <span className="text-green-700 font-medium">Skills Match</span>
                    <span className="text-green-600 font-bold text-xl">85%</span>
                  </div>
                </div>

                {/* Floating notification card */}
                <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-xl p-4 transform -rotate-3 animate-float">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">New match found!</p>
                      <p className="text-gray-500 text-xs">Amazon • SDE II</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gradient fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to land your dream role
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 card-hover border border-violet-100">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="absolute top-6 right-6 text-6xl font-bold text-violet-100 group-hover:text-violet-200 transition-colors">1</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Build Your Profile</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upload your resume or enter your skills manually. Our AI extracts and understands your experience.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl p-8 card-hover border border-yellow-100">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="absolute top-6 right-6 text-6xl font-bold text-yellow-100 group-hover:text-yellow-200 transition-colors">2</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Analyze Any Role</h3>
                <p className="text-gray-600 leading-relaxed">
                  Paste any job posting and instantly see your match percentage, skill gaps, and what you need to learn.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 card-hover border border-green-100">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute top-6 right-6 text-6xl font-bold text-green-100 group-hover:text-green-200 transition-colors">3</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Close the Gap</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get a personalized learning roadmap to fill skill gaps and make yourself the perfect candidate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 mb-8 text-sm font-medium uppercase tracking-wider">
            Get matched with top companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <span className="text-3xl font-bold text-gray-400">Google</span>
            <span className="text-3xl font-bold text-gray-400">Amazon</span>
            <span className="text-3xl font-bold text-gray-400">Meta</span>
            <span className="text-3xl font-bold text-gray-400">Apple</span>
            <span className="text-3xl font-bold text-gray-400">Palo Alto</span>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built For Your Success
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you&apos;re just starting out or making a career pivot
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 card-hover">
              <div className="text-5xl mb-6">🎓</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Recent Graduates</h3>
              <p className="text-gray-600">
                Understand which skills make you competitive and land your first role at a top company.
              </p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 card-hover">
              <div className="text-5xl mb-6">🔄</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Career Switchers</h3>
              <p className="text-gray-600">
                Identify transferable skills and discover the fastest path to your new dream career.
              </p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-green-50 to-white border border-green-100 card-hover">
              <div className="text-5xl mb-6">🚀</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Level Up</h3>
              <p className="text-gray-600">
                Already working? Find skill gaps for your next promotion or lateral move.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-purple relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-10 left-10 w-64 h-64 bg-yellow-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-400 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to land your dream job?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join thousands of candidates who got matched with their perfect role.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button variant="yellow" size="lg" rightIcon>
                Get Started Free
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline-dark" size="lg" rightIcon>
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-xl font-bold">SKILLBRIDGE</span>
              <p className="text-gray-400 mt-2 text-sm">Your career navigator</p>
            </div>
            <div className="flex space-x-8 text-gray-400 text-sm">
              <Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link>
              <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            © 2026 SkillBridge. Built for Palo Alto Networks Case Study.
          </div>
        </div>
      </footer>
    </div>
  );
}
