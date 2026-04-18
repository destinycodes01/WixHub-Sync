import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { CheckCircle2, AlertCircle, Link as LinkIcon, Unlink } from 'lucide-react';

interface ConnectionPanelProps {
  user: User;
}

export default function ConnectionPanel({ user }: ConnectionPanelProps) {
  const [isHubSpotConnected, setIsHubSpotConnected] = useState(false);
  const [isWixConnected, setIsWixConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hubDomain, setHubDomain] = useState('');

  useEffect(() => {
    const checkConnections = async () => {
      try {
        // Check HubSpot
        const hsDocRef = doc(db, 'hubspot_connections', user.uid);
        const hsDocSnap = await getDoc(hsDocRef);
        if (hsDocSnap.exists()) {
          setIsHubSpotConnected(true);
          setHubDomain(hsDocSnap.data().hubDomain || 'Connected Account');
        }

        // Check Wix
        const wixDocRef = doc(db, 'wix_connections', user.uid);
        const wixDocSnap = await getDoc(wixDocRef);
        if (wixDocSnap.exists()) {
          setIsWixConnected(true);
        }

        // Clean up URL params if returning from OAuth
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('hubspot_connected')) {
          const status = urlParams.get('hubspot_connected');
          const details = urlParams.get('details');
          if (status === 'error') {
            alert(`HubSpot Connection Failed:\n\n${details ? decodeURIComponent(details) : 'Unknown error'}`);
          }
        }
        
        if (urlParams.has('wix_connected')) {
          const status = urlParams.get('wix_connected');
          const details = urlParams.get('details');
          if (status === 'error') {
            alert(`Wix Connection Failed:\n\n${details ? decodeURIComponent(details) : 'Unknown error'}`);
          }
        }

        if (urlParams.has('hubspot_connected') || urlParams.has('wix_connected')) {
          // Use replaceState to clear the URL without triggering a page reload
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: newUrl }, '', newUrl);
        }
      } catch (error) {
        console.error("Error checking connections:", error);
      } finally {
        setLoading(false);
      }
    };

    checkConnections();
  }, [user.uid]);

  const handleConnectHubSpot = async () => {
    try {
      window.location.href = `/api/hubspot/auth?userId=${user.uid}`;
    } catch (error) {
      console.error("Failed to start HubSpot OAuth:", error);
    }
  };

  const handleDisconnectHubSpot = async () => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'hubspot_connections', user.uid));
      setIsHubSpotConnected(false);
      setHubDomain('');
    } catch (error) {
      console.error("Error disconnecting HubSpot:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWix = async () => {
    try {
      window.location.href = `/api/wix/auth?userId=${user.uid}`;
    } catch (error) {
      console.error("Failed to start Wix OAuth:", error);
    }
  };

  const handleDisconnectWix = async () => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'wix_connections', user.uid));
      setIsWixConnected(false);
    } catch (error) {
      console.error("Error disconnecting Wix:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-white rounded-xl p-6 h-48"></div>;
  }

  return (
    <div className="space-y-6">
      {/* HubSpot Connection */}
      <div className="bg-neutral-card rounded-xl shadow-sm border border-neutral-border overflow-hidden w-full">
        <div className="p-4 md:p-6 border-b border-neutral-border">
          <h2 className="text-lg font-semibold text-neutral-text">HubSpot Integration</h2>
          <p className="text-sm text-neutral-subtext mt-1">Connect your HubSpot account to enable bi-directional syncing.</p>
        </div>
        
        <div className="p-4 md:p-6">
          {isHubSpotConnected ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">Connected to HubSpot</p>
                  <p className="text-xs text-green-700 truncate">{hubDomain}</p>
                </div>
              </div>
              <button
                onClick={handleDisconnectHubSpot}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Unlink className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-neutral-bg border border-neutral-border rounded-lg p-4 gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-neutral-subtext shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-text truncate">Not Connected</p>
                  <p className="text-xs text-neutral-subtext truncate">Authorize WixHub Sync to access your HubSpot data.</p>
                </div>
              </div>
              <button
                onClick={handleConnectHubSpot}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-orange-main rounded-lg hover:bg-brand-orange-dark transition-colors shadow-sm"
              >
                <LinkIcon className="w-4 h-4" />
                Connect HubSpot
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wix Connection */}
      <div className="bg-neutral-card rounded-xl shadow-sm border border-neutral-border overflow-hidden w-full">
        <div className="p-4 md:p-6 border-b border-neutral-border">
          <h2 className="text-lg font-semibold text-neutral-text">Wix Integration</h2>
          <p className="text-sm text-neutral-subtext mt-1">Connect your Wix account to sync contacts and form submissions.</p>
        </div>
        
        <div className="p-4 md:p-6">
          {isWixConnected ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">Connected to Wix</p>
                  <p className="text-xs text-green-700 truncate">Active Connection</p>
                </div>
              </div>
              <button
                onClick={handleDisconnectWix}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Unlink className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-neutral-bg border border-neutral-border rounded-lg p-4 gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-neutral-subtext shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-text truncate">Not Connected</p>
                  <p className="text-xs text-neutral-subtext truncate">Authorize WixHub Sync to access your Wix data.</p>
                </div>
              </div>
              <button
                onClick={handleConnectWix}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-blue-main rounded-lg hover:bg-brand-blue-light transition-colors shadow-sm"
              >
                <LinkIcon className="w-4 h-4" />
                Connect Wix
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
