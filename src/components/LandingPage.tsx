import { useState } from 'react';
import { ArrowLeftRight, ShieldCheck, LayoutDashboard, FormInput, Zap, Twitter, Github, Linkedin, Send, Menu, X, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

          <div className="hidden md:block">
            <button 
              onClick={onLogin} 
              className="bg-brand-blue-main text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-blue-light transition-colors shadow-sm"
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-neutral-text hover:bg-neutral-border rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-neutral-bg border-t border-neutral-border px-6 py-4 flex flex-col gap-4 shadow-lg absolute w-full left-0">
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-text font-medium hover:text-brand-blue-main transition-colors">Home</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-text font-medium hover:text-brand-blue-main transition-colors">About</a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-text font-medium hover:text-brand-blue-main transition-colors">Features</a>
            <a href="#usage" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-text font-medium hover:text-brand-blue-main transition-colors">Usage</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-text font-medium hover:text-brand-blue-main transition-colors">Contact</a>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); onLogin(); }} 
              className="bg-brand-blue-main text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-blue-light transition-colors shadow-sm w-full mt-2"
            >
              Sign In
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative container mx-auto px-6 pt-32 pb-24 text-center scroll-mt-20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-blue-light/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-orange-main/5 rounded-full blur-3xl -z-10"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue-main/10 text-brand-blue-main text-sm font-medium mb-8 border border-brand-blue-main/20">
            <span className="flex h-2 w-2 rounded-full bg-brand-blue-main"></span>
            Wix & HubSpot Integration
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-neutral-text mb-6 max-w-5xl mx-auto leading-[1.1]">
            Sync your Wix contacts with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-main to-brand-blue-light">HubSpot</span> seamlessly
          </h1>
          <p className="text-lg md:text-xl text-neutral-subtext mb-10 max-w-2xl mx-auto leading-relaxed">
            Automate data flow, prevent conflicts, and keep your leads updated in real-time. The enterprise-grade bridge between your website and CRM.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={onLogin} 
              className="bg-brand-blue-main text-white px-8 py-4 rounded-xl font-medium hover:bg-brand-blue-light transition-all duration-300 shadow-[0_8px_30px_rgb(30,58,138,0.3)] hover:shadow-[0_8px_30px_rgb(30,58,138,0.5)] active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
              <Zap className="w-5 h-5" />
              Get Started Free
            </button>
            <button 
              onClick={onLogin} 
              className="bg-white text-neutral-text border border-neutral-border px-8 py-4 rounded-xl font-medium hover:bg-neutral-bg hover:border-brand-blue-main/30 transition-all duration-300 shadow-sm active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
              <LayoutDashboard className="w-5 h-5 text-brand-blue-main" />
              Open Dashboard
            </button>
          </div>
          
          <div className="mt-16 pt-8 border-t border-neutral-border/50 flex flex-wrap justify-center gap-8 text-sm text-neutral-subtext font-medium">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-orange-main" /> No credit card required</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-orange-main" /> 14-day free trial</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-orange-main" /> Cancel anytime</div>
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white border-y border-neutral-border scroll-mt-20 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row items-center gap-16"
          >
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-sm font-bold tracking-widest text-brand-orange-main uppercase mb-3">Our Mission</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-neutral-text leading-tight">
                  Bridging the gap between your website and CRM
                </h3>
              </div>
              <div className="space-y-6 text-lg text-neutral-subtext leading-relaxed">
                <p>
                  WixHub Sync was born out of a simple necessity. We realized that businesses were spending countless hours manually transferring leads, risking data loss and human error.
                </p>
                <p>
                  Our mission is to empower marketing and sales teams by providing a seamless, secure, and real-time synchronization tool. Whether you are capturing new leads through Wix forms or updating contact details in HubSpot, we ensure your data is always accurate and actionable.
                </p>
              </div>
              <div className="pt-4">
                <button onClick={onLogin} className="text-brand-blue-main font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                  Learn more about our technology <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue-main/20 to-transparent rounded-2xl transform translate-x-4 translate-y-4 -z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80" 
                alt="Team working on software integration" 
                className="rounded-2xl shadow-2xl w-full object-cover border border-neutral-border/50"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-neutral-bg py-24 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold tracking-widest text-brand-blue-main uppercase mb-3">Capabilities</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-neutral-text mb-6">Powerful Features</h3>
            <p className="text-lg text-neutral-subtext max-w-2xl mx-auto">Everything you need to keep your sales and marketing data perfectly aligned, without writing a single line of code.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl border border-neutral-border bg-white hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-brand-blue-main/10 rounded-xl flex items-center justify-center mb-6 text-brand-blue-main group-hover:bg-brand-blue-main group-hover:text-white transition-colors">
                <ArrowLeftRight className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-neutral-text">Bi-Directional Sync</h3>
              <p className="text-neutral-subtext leading-relaxed">Keep data consistent across both platforms. Changes in Wix reflect in HubSpot and vice versa, instantly.</p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-8 rounded-2xl border border-neutral-border bg-white hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-brand-orange-main/10 rounded-xl flex items-center justify-center mb-6 text-brand-orange-main group-hover:bg-brand-orange-main group-hover:text-white transition-colors">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-neutral-text">Secure OAuth 2.0</h3>
              <p className="text-neutral-subtext leading-relaxed">Enterprise-grade security ensures your CRM data and credentials remain completely safe and compliant.</p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-8 rounded-2xl border border-neutral-border bg-white hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-brand-blue-main/10 rounded-xl flex items-center justify-center mb-6 text-brand-blue-main group-hover:bg-brand-blue-main group-hover:text-white transition-colors">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-neutral-text">Visual Field Mapping</h3>
              <p className="text-neutral-subtext leading-relaxed">Intuitive drag-and-drop dashboard to map custom Wix fields to standard or custom HubSpot properties.</p>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-8 rounded-2xl border border-neutral-border bg-white hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-brand-orange-main/10 rounded-xl flex items-center justify-center mb-6 text-brand-orange-main group-hover:bg-brand-orange-main group-hover:text-white transition-colors">
                <FormInput className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-neutral-text">Form Integration</h3>
              <p className="text-neutral-subtext leading-relaxed">Capture leads directly from Wix forms with full UTM, source tracking, and custom field support.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="usage" className="py-24 bg-white border-y border-neutral-border scroll-mt-20 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold tracking-widest text-brand-orange-main uppercase mb-3">Workflow</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-neutral-text mb-6">How It Works</h3>
            <p className="text-lg text-neutral-subtext max-w-2xl mx-auto">Get up and running in minutes, not days. No engineering required.</p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-brand-blue-main/20 via-brand-orange-main/20 to-brand-blue-main/20 -translate-y-1/2 -z-10"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col items-center text-center relative bg-white p-6 rounded-2xl"
              >
                <div className="w-20 h-20 bg-white border-4 border-brand-blue-main text-brand-blue-main rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-xl">1</div>
                <h3 className="text-xl font-bold mb-3 text-neutral-text">Connect Platforms</h3>
                <p className="text-neutral-subtext leading-relaxed">Authenticate securely with your Wix and HubSpot portals using OAuth 2.0.</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col items-center text-center relative bg-white p-6 rounded-2xl"
              >
                <div className="w-20 h-20 bg-white border-4 border-brand-blue-main text-brand-blue-main rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-xl">2</div>
                <h3 className="text-xl font-bold mb-3 text-neutral-text">Map Your Fields</h3>
                <p className="text-neutral-subtext leading-relaxed">Use our visual builder to link Wix contact fields to HubSpot properties.</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col items-center text-center relative bg-white p-6 rounded-2xl"
              >
                <div className="w-20 h-20 bg-brand-orange-main border-4 border-white text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-xl ring-4 ring-brand-orange-main/20">3</div>
                <h3 className="text-xl font-bold mb-3 text-neutral-text">Sync Automatically</h3>
                <p className="text-neutral-subtext leading-relaxed">Sit back and relax. Your data now flows seamlessly in real-time.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-neutral-bg scroll-mt-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-bold tracking-widest text-brand-blue-main uppercase mb-3">Support</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-neutral-text mb-6">Get in Touch</h3>
              <p className="text-lg text-neutral-subtext mb-8 leading-relaxed">
                Have questions about WixHub Sync? Need help with a custom integration? Our team is here to help you succeed.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-border shrink-0">
                    <Send className="w-5 h-5 text-brand-blue-main" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-text">Email Us</h4>
                    <p className="text-neutral-subtext">support@wixhubsync.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-border shrink-0">
                    <Twitter className="w-5 h-5 text-brand-blue-main" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-text">Follow Us</h4>
                    <p className="text-neutral-subtext">@WixHubSync</p>
                  </div>
                </div>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-xl border border-neutral-border p-8 md:p-10"
            >
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-text mb-2">First Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-main/50 focus:border-brand-blue-main bg-neutral-bg/50 transition-all" 
                      placeholder="John" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-text mb-2">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-main/50 focus:border-brand-blue-main bg-neutral-bg/50 transition-all" 
                      placeholder="Doe" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-text mb-2">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-main/50 focus:border-brand-blue-main bg-neutral-bg/50 transition-all" 
                    placeholder="john@example.com" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-text mb-2">Message</label>
                  <textarea 
                    rows={4} 
                    className="w-full px-4 py-3 border border-neutral-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-main/50 focus:border-brand-blue-main bg-neutral-bg/50 transition-all resize-none" 
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-brand-blue-main text-white font-medium py-4 rounded-xl hover:bg-brand-blue-light transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-brand-blue-main py-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-brand-blue-main/50 to-transparent"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to unify your data?</h2>
            <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-xl leading-relaxed">Join thousands of businesses that trust WixHub Sync to keep their sales and marketing perfectly aligned.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={onLogin} 
                className="bg-brand-orange-main text-white px-10 py-4 rounded-xl font-bold hover:bg-brand-orange-dark transition-all duration-300 shadow-[0_8px_30px_rgb(249,115,22,0.3)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.5)] active:scale-95 text-lg"
              >
                Get Started for Free
              </button>
            </div>
          </motion.div>
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
