import { useState } from 'react';
import { items } from '@wix/data';
import { createClient, OAuthStrategy } from '@wix/sdk';
import { Database, Search } from 'lucide-react';

export default function WixDataTest() {
  const [dataItems, setDataItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWixData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Initialize Wix Client using the provided Client ID
      const myWixClient = createClient({
        modules: { items },
        auth: OAuthStrategy({ clientId: '956ab539-d106-4975-868b-d0d3fafb0cd1' }),
      });

      // Query the collection 'Locations/Locations'
      const dataItemsList = await myWixClient.items.query('Locations/Locations').find();

      console.log('My Data Items:');
      console.log('Total: ', dataItemsList.items.length);
      console.log(dataItemsList.items.map((item) => item.data?._id).join('\n'));

      setDataItems(dataItemsList.items);
    } catch (err: any) {
      console.error('Wix SDK Fetch Error:', err);
      setError(err.message || 'Failed to fetch Wix data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-card rounded-xl shadow-sm border border-neutral-border overflow-hidden w-full mt-6">
      <div className="p-4 md:p-6 border-b border-neutral-border">
        <h2 className="text-lg font-semibold text-neutral-text">Wix Data SDK Test</h2>
        <p className="text-sm text-neutral-subtext mt-1">
          Testing connection via @wix/sdk for collection: <code className="bg-gray-100 px-1 rounded">Locations/Locations</code>
        </p>
      </div>

      <div className="p-4 md:p-6">
        <button
          onClick={fetchWixData}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-blue-main rounded-lg hover:bg-brand-blue-light transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Search className="w-4 h-4" />
          )}
          Fetch Wix Data
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {dataItems.length > 0 && (
          <div className="mt-6 border border-neutral-border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b border-neutral-border flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-text">
                Results ({dataItems.length})
              </span>
              <Database className="w-4 h-4 text-neutral-subtext" />
            </div>
            <div className="max-h-64 overflow-y-auto p-4 bg-white">
              <pre className="text-xs text-neutral-subtext whitespace-pre-wrap">
                {JSON.stringify(dataItems, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
