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
    <div className="bg-neutral-card rounded-xl shadow-sm border border-neutral-border overflow-hidden w-full">
      <div className="p-4 md:p-6 border-b border-neutral-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-text">Field Mapping</h2>
          <p className="text-sm text-neutral-subtext mt-1">Configure how data flows between Wix and HubSpot.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-orange-main rounded-lg hover:bg-brand-orange-dark transition-colors disabled:opacity-50 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Mappings'}
        </button>
      </div>
      
      <div className="p-4 md:p-6">
        <div className="overflow-x-auto rounded-lg border border-neutral-border">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr className="border-b border-neutral-border">
                <th className="px-4 py-3 text-sm font-medium text-neutral-subtext">Wix Field</th>
                <th className="px-4 py-3 text-sm font-medium text-neutral-subtext text-center">Sync Direction</th>
                <th className="px-4 py-3 text-sm font-medium text-neutral-subtext">HubSpot Property</th>
                <th className="px-4 py-3 text-sm font-medium text-neutral-subtext w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border bg-white">
              {mappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={mapping.wixField}
                      onChange={(e) => handleChange(mapping.id, 'wixField', e.target.value)}
                      placeholder="e.g., firstName"
                      className="w-full px-3 py-2 border border-neutral-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-light text-neutral-text"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={mapping.direction}
                      onChange={(e) => handleChange(mapping.id, 'direction', e.target.value as any)}
                      className="px-3 py-2 border border-neutral-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-light bg-white text-neutral-text"
                    >
                      <option value="bi-directional">Bi-directional (↔)</option>
                      <option value="wix-to-hubspot">Wix to HubSpot (→)</option>
                      <option value="hubspot-to-wix">HubSpot to Wix (←)</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={mapping.hubspotProperty}
                      onChange={(e) => handleChange(mapping.id, 'hubspotProperty', e.target.value)}
                      placeholder="e.g., firstname"
                      className="w-full px-3 py-2 border border-neutral-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-light text-neutral-text"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRemoveMapping(mapping.id)}
                      className="p-2 text-neutral-subtext hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
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
          className="mt-4 flex items-center gap-2 text-sm font-medium text-brand-blue-main hover:text-brand-blue-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Field Mapping
        </button>
      </div>
    </div>
  );
}
