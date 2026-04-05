import { ArrowLeftRight, ShieldCheck, LayoutDashboard, FormInput, Zap, Twitter, Github, Linkedin, Send } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-text font-sans">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-neutral-bg/90 backdrop-blur-md border-b border-neutral-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="https://i.ibb.co/K3pyhF3/wixhublogo-removedbg.png" 
              alt="WixHub Sync Logo" 
              className="w-8 h-8 object-contain" 
              referrerPolicy="no-referrer" 
            />
            <span className="text-xl font-bold text-brand-blue-main">WixHub Sync</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-subtext">
            <a href="#home" className="hover:text-brand-blue-main transition-colors">Home</a>
            <a href="#about" className="hover:text-brand-blue-main transition-colors">About</a>
            <a href="#features" className="hover:text-brand-blue-main transition-colors">Features</a>
            <a href="#usage" className="hover:text-brand-blue-main transition-colors">Usage</a>
            <a href="#contact" className="hover:text-brand-blue-main transition-colors">Contact</a>
          </div>

          <button 
            onClick={onLogin} 
            className="bg-brand-blue-main text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-blue-light transition-colors shadow-sm"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="container mx-auto px-6 py-20 text-center scroll-mt-20">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-brand-blue-main mb-6 max-w-4xl mx-auto leading-tight">
          Sync your Wix contacts with HubSpot seamlessly
        </h1>
        <p className="text-lg md:text-xl text-neutral-subtext mb-10 max-w-2xl mx-auto">
          Automate data flow, prevent conflicts, and keep your leads updated in real-time.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={onLogin} 
            className="bg-brand-orange-main text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-orange-dark transition-all duration-200 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Connect HubSpot
          </button>
          <button 
            onClick={onLogin} 
            className="bg-neutral-card text-brand-blue-main border border-neutral-border px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-5 h-5" />
            Open Dashboard
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-neutral-card border-y border-neutral-border scroll-mt-20">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-brand-blue-main mb-6">About WixHub Sync</h2>
            <p className="text-neutral-subtext mb-4 leading-relaxed">
              WixHub Sync was born out of a simple necessity: bridging the gap between Wix's powerful website builder and HubSpot's industry-leading CRM. We realized that businesses were spending countless hours manually transferring leads, risking data loss and human error.
            </p>
            <p className="text-neutral-subtext leading-relaxed">
              Our mission is to empower marketing and sales teams by providing a seamless, secure, and real-time synchronization tool. Whether you are capturing new leads through Wix forms or updating contact details in HubSpot, WixHub Sync ensures your data is always accurate and actionable.
            </p>
          </div>
          <div className="flex-1">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" 
              alt="Data synchronization and analytics dashboard" 
              className="rounded-xl shadow-lg w-full object-cover border border-neutral-border"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-neutral-bg py-20 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-brand-blue-main mb-4">Powerful Features</h2>
            <p className="text-neutral-subtext max-w-2xl mx-auto">Everything you need to keep your sales and marketing data perfectly aligned.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-neutral-border hover:shadow-lg transition-shadow bg-neutral-card group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-brand-blue-main group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-text">Bi-Directional Sync</h3>
              <p className="text-neutral-subtext text-sm">Keep data consistent across both platforms. Changes in Wix reflect in HubSpot and vice versa.</p>
            </div>
            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-neutral-border hover:shadow-lg transition-shadow bg-neutral-card group">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 text-brand-orange-main group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-text">Secure OAuth 2.0</h3>
              <p className="text-neutral-subtext text-sm">Enterprise-grade security ensures your CRM data and credentials remain completely safe.</p>
            </div>
            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-neutral-border hover:shadow-lg transition-shadow bg-neutral-card group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-brand-blue-main group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-text">Field Mapping</h3>
              <p className="text-neutral-subtext text-sm">Intuitive dashboard to map custom Wix fields to standard or custom HubSpot properties.</p>
            </div>
            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-neutral-border hover:shadow-lg transition-shadow bg-neutral-card group">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 text-brand-orange-main group-hover:scale-110 transition-transform">
                <FormInput className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-text">Form Integration</h3>
              <p className="text-neutral-subtext text-sm">Capture leads directly from Wix forms with full UTM and source tracking support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="usage" className="py-20 bg-neutral-card border-y border-neutral-border scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-brand-blue-main mb-4">How It Works</h2>
            <p className="text-neutral-subtext max-w-2xl mx-auto">Get up and running in minutes, not days.</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12">
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 bg-brand-blue-main text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">1</div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-text">Connect HubSpot</h3>
              <p className="text-neutral-subtext text-sm">Authenticate securely with your HubSpot portal using OAuth 2.0.</p>
            </div>
            <div className="hidden md:block w-16 h-0.5 bg-neutral-border"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 bg-brand-blue-main text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">2</div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-text">Map Your Fields</h3>
              <p className="text-neutral-subtext text-sm">Use our visual builder to link Wix contact fields to HubSpot properties.</p>
            </div>
            <div className="hidden md:block w-16 h-0.5 bg-neutral-border"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 bg-brand-orange-main text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">3</div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-text">Sync Automatically</h3>
              <p className="text-neutral-subtext text-sm">Sit back and relax. Your data now flows seamlessly in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-neutral-bg scroll-mt-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-blue-main mb-4">Get in Touch</h2>
            <p className="text-neutral-subtext">Have questions about WixHub Sync? We'd love to hear from you.</p>
          </div>
          <div className="bg-neutral-card rounded-xl shadow-sm border border-neutral-border p-8">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-text mb-2">First Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-light bg-neutral-bg" 
                    placeholder="John" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-text mb-2">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-light bg-neutral-bg" 
                    placeholder="Doe" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-text mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-light bg-neutral-bg" 
                  placeholder="john@example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-text mb-2">Message</label>
                <textarea 
                  rows={4} 
                  className="w-full px-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-light bg-neutral-bg" 
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-blue-main text-white font-medium py-3 rounded-lg hover:bg-brand-blue-light transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-blue-main py-20 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to unify your data?</h2>
          <p className="text-blue-200 mb-10 max-w-2xl mx-auto text-lg">Join thousands of businesses that trust WixHub Sync to keep their sales and marketing aligned.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={onLogin} 
              className="bg-brand-orange-main text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-orange-dark transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-card border-t border-neutral-border py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img 
              src="https://i.ibb.co/K3pyhF3/wixhublogo-removedbg.png" 
              alt="WixHub Sync Logo" 
              className="w-6 h-6 object-contain grayscale opacity-70" 
              referrerPolicy="no-referrer" 
            />
            <span className="text-lg font-bold text-neutral-subtext">WixHub Sync</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-subtext">
            <a href="#about" className="hover:text-brand-blue-main transition-colors">About</a>
            <a href="#contact" className="hover:text-brand-blue-main transition-colors">Contact</a>
            <a href="#" className="hover:text-brand-blue-main transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-blue-main transition-colors">Terms of Service</a>
          </div>
          <div className="flex gap-4 text-neutral-subtext">
            <a href="#" className="hover:text-brand-blue-main transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="hover:text-brand-blue-main transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="hover:text-brand-blue-main transition-colors"><Linkedin className="w-5 h-5" /></a>
          </div>
        </div>
        <div className="text-center text-neutral-subtext text-sm mt-8">
          &copy; {new Date().getFullYear()} WixHub Sync. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
