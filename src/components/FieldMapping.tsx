import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Save, ArrowRightLeft, ArrowRight, ArrowLeft } from 'lucide-react';

interface FieldMappingProps {
  user: User;
}

interface Mapping {
  id: string;
  wixField: string;
  hubspotProperty: string;
  direction: 'wix-to-hubspot' | 'hubspot-to-wix' | 'bi-directional';
}

export default function FieldMapping({ user }: FieldMappingProps) {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadMappings = async () => {
      try {
        const q = query(collection(db, `users/${user.uid}/mappings`));
        const querySnapshot = await getDocs(q);
        const loadedMappings: Mapping[] = [];
        querySnapshot.forEach((doc) => {
          loadedMappings.push({ id: doc.id, ...doc.data() } as Mapping);
        });
        
        if (loadedMappings.length === 0) {
          // Default mappings
          loadedMappings.push(
            { id: '1', wixField: 'firstName', hubspotProperty: 'firstname', direction: 'bi-directional' },
            { id: '2', wixField: 'lastName', hubspotProperty: 'lastname', direction: 'bi-directional' },
            { id: '3', wixField: 'email', hubspotProperty: 'email', direction: 'bi-directional' }
          );
        }
        
        setMappings(loadedMappings);
      } catch (error) {
        console.error("Error loading mappings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMappings();
  }, [user.uid]);

  const handleAddMapping = () => {
    const newId = Date.now().toString();
    setMappings([...mappings, { id: newId, wixField: '', hubspotProperty: '', direction: 'bi-directional' }]);
  };

  const handleRemoveMapping = async (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, `users/${user.uid}/mappings`, id));
    } catch (error) {
      console.error("Error deleting mapping:", error);
    }
  };

  const handleChange = (id: string, field: keyof Mapping, value: string) => {
    setMappings(mappings.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const mapping of mappings) {
        if (mapping.wixField && mapping.hubspotProperty) {
          await setDoc(doc(db, `users/${user.uid}/mappings`, mapping.id), mapping);
        }
      }
      // Show success toast here in a real app
    } catch (error) {
      console.error("Error saving mappings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-white rounded-xl p-6 h-64"></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Field Mapping</h2>
          <p className="text-sm text-gray-500 mt-1">Configure how data flows between Wix and HubSpot.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Mappings'}
        </button>
      </div>
      
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-sm font-medium text-gray-500">Wix Field</th>
                <th className="pb-3 text-sm font-medium text-gray-500 text-center">Sync Direction</th>
                <th className="pb-3 text-sm font-medium text-gray-500">HubSpot Property</th>
                <th className="pb-3 text-sm font-medium text-gray-500 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="py-3 pr-4">
                    <input
                      type="text"
                      value={mapping.wixField}
                      onChange={(e) => handleChange(mapping.id, 'wixField', e.target.value)}
                      placeholder="e.g., firstName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={mapping.direction}
                      onChange={(e) => handleChange(mapping.id, 'direction', e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="bi-directional">Bi-directional (↔)</option>
                      <option value="wix-to-hubspot">Wix to HubSpot (→)</option>
                      <option value="hubspot-to-wix">HubSpot to Wix (←)</option>
                    </select>
                  </td>
                  <td className="py-3 pl-4">
                    <input
                      type="text"
                      value={mapping.hubspotProperty}
                      onChange={(e) => handleChange(mapping.id, 'hubspotProperty', e.target.value)}
                      placeholder="e.g., firstname"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <button
                      onClick={() => handleRemoveMapping(mapping.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button
          onClick={handleAddMapping}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Field Mapping
        </button>
      </div>
    </div>
  );
}
