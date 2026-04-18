import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SyncLogsProps {
  user: User;
}

interface Log {
  id: string;
  source: 'wix' | 'hubspot';
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}

export default function SyncLogs({ user }: SyncLogsProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'sync_logs'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      
      const fetchedLogs: Log[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedLogs.push({
          id: doc.id,
          source: data.source,
          status: data.status,
          message: data.message,
          timestamp: data.timestamp,
        });
      });
      
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user.uid]);

  return (
    <div className="bg-neutral-card rounded-xl shadow-sm border border-neutral-border overflow-hidden w-full">
      <div className="p-4 md:p-6 border-b border-neutral-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-text">Sync Logs</h2>
          <p className="text-sm text-neutral-subtext mt-1">Recent activity and synchronization events.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 text-neutral-subtext hover:text-brand-blue-main transition-colors rounded-lg hover:bg-brand-blue-main/10 shrink-0"
          title="Refresh logs"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="divide-y divide-neutral-border max-h-[600px] overflow-y-auto">
        {loading && logs.length === 0 ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-main"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-neutral-subtext">
            No sync logs found.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-neutral-bg transition-colors flex items-start gap-4">
              <div className="mt-1">
                {log.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-text">{log.message}</p>
                <div className="mt-1 flex items-center gap-4 text-xs text-neutral-subtext">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${log.source === 'wix' ? 'bg-brand-blue-main' : 'bg-brand-orange-main'}`}></span>
                    {log.source === 'wix' ? 'Wix → HubSpot' : 'HubSpot → Wix'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
