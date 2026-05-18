import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-pharmacy-light via-white to-slate-50 flex items-center">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pharmacy rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 w-full py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-block mb-4">
                <span className="rounded-full bg-pharmacy/10 px-4 py-2 text-sm font-semibold text-pharmacy">Your Health, Our Priority</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Medicine Delivery Made Easy
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Order prescriptions, manage your health records, and connect with pharmacies—all in one trusted platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/register" className="inline-flex rounded-full bg-pharmacy text-white px-8 py-4 text-lg font-semibold shadow-lg hover:bg-pharmacy-dark transition transform hover:scale-105">
                  Get Started
                </Link>
                <Link href="/auth/login" className="inline-flex rounded-full border-2 border-slate-300 bg-white text-slate-900 px-8 py-4 text-lg font-semibold hover:border-pharmacy hover:text-pharmacy transition">
                  Sign In
                </Link>
              </div>
              <div className="mt-12 flex gap-8">
                <div>
                  <p className="text-3xl font-bold text-pharmacy">10K+</p>
                  <p className="text-slate-600">Active Users</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-pharmacy">500+</p>
                  <p className="text-slate-600">Pharmacies</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-pharmacy">99%</p>
                  <p className="text-slate-600">Satisfaction</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-pharmacy to-pharmacy-dark p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">💊</div>
                      <h3 className="font-semibold text-lg">Fast Delivery</h3>
                    </div>
                    <p className="text-sm text-white/80">Get your medicines delivered within hours</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">📋</div>
                      <h3 className="font-semibold text-lg">Prescriptions</h3>
                    </div>
                    <p className="text-sm text-white/80">Manage all your prescriptions securely</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">💬</div>
                      <h3 className="font-semibold text-lg">Chat Support</h3>
                    </div>
                    <p className="text-sm text-white/80">Connect with pharmacists anytime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Why Choose MediSmart?</h2>
            <p className="text-xl text-slate-600">Everything you need for a seamless pharmacy experience</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '🔍',
                title: 'Browse & Compare',
                description: 'Search medicines across multiple pharmacies and compare prices in real-time.'
              },
              {
                icon: '🛒',
                title: 'Smart Cart',
                description: 'Easy-to-use cart with quantity management and checkout in minutes.'
              },
              {
                icon: '📦',
                title: 'Order Tracking',
                description: 'Real-time updates on your order status from confirmation to delivery.'
              },
              {
                icon: '💬',
                title: 'Direct Chat',
                description: 'Chat with pharmacists to get answers and manage your orders instantly.'
              },
              {
                icon: '📱',
                title: 'Digital Prescriptions',
                description: 'Upload and manage your prescriptions securely in one place.'
              },
              {
                icon: '🔒',
                title: 'Secure & Private',
                description: 'Your health data is protected with enterprise-grade security.'
              },
            ].map((feature, index) => (
              <div key={index} className="rounded-2xl bg-slate-50 p-8 hover:shadow-lg transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-pharmacy to-pharmacy-dark py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-white/90">Join thousands of users managing their health with MediSmart today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/register" className="inline-flex rounded-full bg-white text-pharmacy px-8 py-4 font-semibold hover:bg-slate-100 transition">
              Create Account
            </Link>
            <Link href="/auth/login" className="inline-flex rounded-full border-2 border-white text-white px-8 py-4 font-semibold hover:bg-white/10 transition">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
