import { ArrowLeftRight, ShieldCheck, LayoutDashboard, FormInput, Zap, Twitter, Github, Linkedin } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
            src="https://i.ibb.co/K3pyhF3/wixhublogo-removedbg.png" 
            alt="WixHub Sync Logo" 
            className="w-8 h-8 object-contain" 
            referrerPolicy="no-referrer" 
          />
          <span className="text-xl font-bold text-brand-blue">WixHub Sync</span>
        </div>
        <button 
          onClick={onLogin} 
          className="text-brand-blue font-medium hover:text-brand-orange transition-colors"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-brand-blue mb-6 max-w-4xl mx-auto leading-tight">
          Sync your Wix contacts with HubSpot seamlessly
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Automate data flow, prevent conflicts, and keep your leads updated in real-time.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={onLogin} 
            className="bg-brand-orange text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-600 transition-all duration-200 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Connect HubSpot
          </button>
          <button 
            onClick={onLogin} 
            className="bg-white text-brand-blue border border-brand-border px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-5 h-5" />
            Open Dashboard
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 border-y border-brand-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-brand-blue mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Everything you need to keep your sales and marketing data perfectly aligned.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-brand-border hover:shadow-lg transition-shadow bg-brand-bg group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-brand-blue group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bi-Directional Sync</h3>
              <p className="text-gray-600 text-sm">Keep data consistent across both platforms. Changes in Wix reflect in HubSpot and vice versa.</p>
            </div>
            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-brand-border hover:shadow-lg transition-shadow bg-brand-bg group">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 text-brand-orange group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure OAuth 2.0</h3>
              <p className="text-gray-600 text-sm">Enterprise-grade security ensures your CRM data and credentials remain completely safe.</p>
            </div>
            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-brand-border hover:shadow-lg transition-shadow bg-brand-bg group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-brand-blue group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Field Mapping</h3>
              <p className="text-gray-600 text-sm">Intuitive dashboard to map custom Wix fields to standard or custom HubSpot properties.</p>
            </div>
            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-brand-border hover:shadow-lg transition-shadow bg-brand-bg group">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 text-brand-orange group-hover:scale-110 transition-transform">
                <FormInput className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Form Integration</h3>
              <p className="text-gray-600 text-sm">Capture leads directly from Wix forms with full UTM and source tracking support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-brand-bg">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-brand-blue mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Get up and running in minutes, not days.</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12">
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 bg-brand-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">1</div>
              <h3 className="text-xl font-semibold mb-2">Connect HubSpot</h3>
              <p className="text-gray-600 text-sm">Authenticate securely with your HubSpot portal using OAuth 2.0.</p>
            </div>
            <div className="hidden md:block w-16 h-0.5 bg-brand-border"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 bg-brand-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">2</div>
              <h3 className="text-xl font-semibold mb-2">Map Your Fields</h3>
              <p className="text-gray-600 text-sm">Use our visual builder to link Wix contact fields to HubSpot properties.</p>
            </div>
            <div className="hidden md:block w-16 h-0.5 bg-brand-border"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 bg-brand-orange text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">3</div>
              <h3 className="text-xl font-semibold mb-2">Sync Automatically</h3>
              <p className="text-gray-600 text-sm">Sit back and relax. Your data now flows seamlessly in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-blue py-20 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to unify your data?</h2>
          <p className="text-blue-200 mb-10 max-w-2xl mx-auto text-lg">Join thousands of businesses that trust WixHub Sync to keep their sales and marketing aligned.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={onLogin} 
              className="bg-brand-orange text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-600 transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-brand-border py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img 
              src="https://i.ibb.co/K3pyhF3/wixhublogo-removedbg.png" 
              alt="WixHub Sync Logo" 
              className="w-6 h-6 object-contain grayscale opacity-70" 
              referrerPolicy="no-referrer" 
            />
            <span className="text-lg font-bold text-gray-400">WixHub Sync</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-brand-blue transition-colors">About</a>
            <a href="#" className="hover:text-brand-blue transition-colors">Contact</a>
            <a href="#" className="hover:text-brand-blue transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-blue transition-colors">Terms of Service</a>
          </div>
          <div className="flex gap-4 text-gray-400">
            <a href="#" className="hover:text-brand-blue transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="hover:text-brand-blue transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="hover:text-brand-blue transition-colors"><Linkedin className="w-5 h-5" /></a>
          </div>
        </div>
        <div className="text-center text-gray-400 text-sm mt-8">
          &copy; {new Date().getFullYear()} WixHub Sync. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
