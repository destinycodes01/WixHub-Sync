import { useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { LayoutDashboard, ArrowLeftRight, Settings, LogOut, Link as LinkIcon, FormInput } from 'lucide-react';
import ConnectionPanel from './components/ConnectionPanel';
import FieldMapping from './components/FieldMapping';
import SyncLogs from './components/SyncLogs';
import FormIntegration from './components/FormIntegration';
import LandingPage from './components/LandingPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connection');
  
  // Premium Login States
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    // Handle redirect result for smart fallback
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setLoginSuccess(true);
          setTimeout(() => setLoginSuccess(false), 3000);
        }
      } catch (error: any) {
        console.error('Redirect login failed:', error);
        setLoginError(getErrorMessage(error));
      }
    };
    
    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getErrorMessage = (error: any) => {
    if (error.code === 'auth/popup-closed-by-user') return 'Login was cancelled. Please try again.';
    if (error.code === 'auth/network-request-failed') return 'Network error. Please check your connection or VPN.';
    if (error.code === 'auth/popup-blocked') return 'Popup blocked by browser. Attempting redirect...';
    return 'An error occurred during login. Please try again.';
  };

  // Premium Google Login with Smart Fallback
  const premiumGoogleLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    setLoginError(null);
    setLoginSuccess(false);
    
    try {
      // 1. Try popup first (Premium experience)
      await signInWithPopup(auth, googleProvider);
      setLoginSuccess(true);
      setTimeout(() => setLoginSuccess(false), 3000);
      setIsLoggingIn(false);
    } catch (error: any) {
      console.error('Popup login failed:', error);
      
      // 2. Smart Fallback: If it's a network error, popup blocked, or cross-origin issue, fallback to redirect
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/network-request-failed' ||
        error.code === 'auth/internal-error' ||
        error.message?.includes('timeout') ||
        error.message?.includes('network')
      ) {
        console.log('Falling back to redirect login...');
        setLoginError('Popup failed. Redirecting to secure login...');
        
        try {
          await signInWithRedirect(auth, googleProvider);
          // The page will redirect, so code below might not execute
        } catch (redirectError: any) {
          console.error('Redirect login also failed:', redirectError);
          setLoginError(getErrorMessage(redirectError));
          setIsLoggingIn(false);
        }
      } else {
        setLoginError(getErrorMessage(error));
        setIsLoggingIn(false);
      }
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!user) {
    return <LandingPage 
      onLogin={premiumGoogleLogin} 
      isLoggingIn={isLoggingIn}
      loginError={loginError}
      loginSuccess={loginSuccess}
    />;
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-blue-main border-r border-brand-blue-dark flex flex-col text-white">
        <div className="p-6 border-b border-brand-blue-dark flex items-center gap-3">
          <div className="bg-white rounded-lg p-1">
            <img 
              src="https://i.ibb.co/K3pyhF3/wixhublogo-removedbg.png" 
              alt="WixHub Sync Logo" 
              className="w-8 h-8 object-contain" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <span className="text-xl font-bold text-white">WixHub Sync</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('connection')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'connection' ? 'bg-brand-blue-dark text-white' : 'text-blue-200 hover:bg-brand-blue-light/20 hover:text-white'}`}
          >
            <LinkIcon className="w-5 h-5" />
            HubSpot Connection
          </button>
          <button
            onClick={() => setActiveTab('mapping')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'mapping' ? 'bg-brand-blue-dark text-white' : 'text-blue-200 hover:bg-brand-blue-light/20 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Field Mapping
          </button>
          <button
            onClick={() => setActiveTab('forms')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'forms' ? 'bg-brand-blue-dark text-white' : 'text-blue-200 hover:bg-brand-blue-light/20 hover:text-white'}`}
          >
            <FormInput className="w-5 h-5" />
            Form Integration
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logs' ? 'bg-brand-blue-dark text-white' : 'text-blue-200 hover:bg-brand-blue-light/20 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
            Sync Logs
          </button>
        </nav>

        <div className="p-4 border-t border-brand-blue-dark">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" className="w-10 h-10 rounded-full border-2 border-brand-blue-light" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</p>
              <p className="text-xs text-blue-200 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-blue-dark rounded-lg hover:bg-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'connection' && <ConnectionPanel user={user} />}
          {activeTab === 'mapping' && <FieldMapping user={user} />}
          {activeTab === 'forms' && <FormIntegration user={user} />}
          {activeTab === 'logs' && <SyncLogs user={user} />}
        </div>
      </main>
    </div>
  );
}
