import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Bridge the Gap to Your
          <span className="text-blue-600"> Dream Career</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Discover the skills you need, get personalized learning recommendations,
          and navigate your path to success with AI-powered insights.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/roles">
            <Button variant="outline" size="lg">Browse Roles</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card variant="bordered">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <CardTitle>1. Build Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Add your current skills and select your target role. Our system will understand where you are today.</p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <CardTitle>2. Analyze Your Gap</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Our AI compares your skills against job requirements and identifies exactly what you need to learn.</p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <CardTitle>3. Follow Your Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Get a personalized learning plan with prioritized resources to close your skill gap efficiently.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="bg-white rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Who Is This For?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="font-semibold text-lg mb-2">Recent Graduates</h3>
            <p className="text-gray-600 text-sm">
              Understand which certifications and skills make you competitive in the job market.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="font-semibold text-lg mb-2">Career Switchers</h3>
            <p className="text-gray-600 text-sm">
              Identify transferable skills and discover the fastest path to your new career.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🧭</div>
            <h3 className="font-semibold text-lg mb-2">Mentors</h3>
            <p className="text-gray-600 text-sm">
              Get data-backed insights to guide your mentees development more effectively.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
