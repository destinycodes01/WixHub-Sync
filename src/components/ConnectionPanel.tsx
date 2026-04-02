import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { CheckCircle2, AlertCircle, Link as LinkIcon, Unlink } from 'lucide-react';

interface ConnectionPanelProps {
  user: User;
}

export default function ConnectionPanel({ user }: ConnectionPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const docRef = doc(db, 'hubspot_connections', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setIsConnected(true);
          setDomain(docSnap.data().hubDomain || 'Connected Account');
        }
        
        // Check URL params for mock OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('hubspot_connected') === 'true') {
          // Simulate saving connection
          await setDoc(docRef, {
            userId: user.uid,
            hubDomain: 'demo-account.hubspot.com',
            connectedAt: new Date().toISOString(),
            mockToken: 'mock_token_123'
          });
          setIsConnected(true);
          setDomain('demo-account.hubspot.com');
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [user.uid]);

  const handleConnect = async () => {
    // In a real app, this would redirect to the backend to start OAuth
    // window.location.href = '/api/hubspot/auth';
    
    // For demo, we'll fetch the mock URL from our backend
    try {
      const response = await fetch('/api/hubspot/auth');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error("Failed to start OAuth:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hubspot_connections', user.uid));
      setIsConnected(false);
      setDomain('');
    } catch (error) {
      console.error("Error disconnecting:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-white rounded-xl p-6 h-48"></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">HubSpot Integration</h2>
        <p className="text-sm text-gray-500 mt-1">Connect your HubSpot account to enable bi-directional syncing.</p>
      </div>
      
      <div className="p-6">
        {isConnected ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Connected to HubSpot</p>
                <p className="text-xs text-green-700">{domain}</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Unlink className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Not Connected</p>
                <p className="text-xs text-gray-500">Authorize WixHub Sync to access your HubSpot data.</p>
              </div>
            </div>
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Connect Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
