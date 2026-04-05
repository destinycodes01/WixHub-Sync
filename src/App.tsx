import { useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
      } else {
        console.error('Login failed:', error);
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
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <img 
            src="https://i.ibb.co/K3pyhF3/wixhublogo-removedbg.png" 
            alt="WixHub Sync Logo" 
            className="w-8 h-8 object-contain" 
            referrerPolicy="no-referrer" 
          />
          <span className="text-xl font-bold text-gray-900">WixHub Sync</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('connection')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'connection' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <LinkIcon className="w-5 h-5" />
            HubSpot Connection
          </button>
          <button
            onClick={() => setActiveTab('mapping')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'mapping' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Field Mapping
          </button>
          <button
            onClick={() => setActiveTab('forms')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'forms' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <FormInput className="w-5 h-5" />
            Form Integration
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logs' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Settings className="w-5 h-5" />
            Sync Logs
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" className="w-10 h-10 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
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
