// src/pages/admin/ClientsPage.tsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useStore from '../../store/useStore';

interface Client {
  id: string;
  name: string;
  status?: string;
}

const ClientsPage: React.FC = () => {
  const { user } = useStore();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!user?.businessId) return;
    (async () => {
      const q = query(
        collection(db, 'clients'),
        where('businessId', '==', user.businessId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setClients(data);
    })();
  }, [user?.businessId]);

  // Group clients by status
  const occasional = clients.filter(c => (c.status || 'מזדמן') === 'מזדמן');
  const regular    = clients.filter(c => c.status === 'קבוע');
  const vip        = clients.filter(c => c.status === 'VIP');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">לקוחות לפי סטטוס</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-center">מזדמן</th>
              <th className="border px-4 py-2 text-center">קבוע</th>
              <th className="border px-4 py-2 text-center">VIP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2 align-top">
                <ul className="list-disc pl-5 space-y-1">
                  {occasional.map(c => (
                    <li key={c.id} className="text-gray-700">{c.name}</li>
                  ))}
                  {occasional.length === 0 && <li className="text-gray-400">אין לקוחות</li>}
                </ul>
              </td>

              <td className="border px-4 py-2 align-top">
                <ul className="list-disc pl-5 space-y-1">
                  {regular.map(c => (
                    <li key={c.id} className="text-gray-700">{c.name}</li>
                  ))}
                  {regular.length === 0 && <li className="text-gray-400">אין לקוחות</li>}
                </ul>
              </td>

              <td className="border px-4 py-2 align-top">
                <ul className="list-disc pl-5 space-y-1">
                  {vip.map(c => (
                    <li key={c.id} className="text-gray-700">{c.name}</li>
                  ))}
                  {vip.length === 0 && <li className="text-gray-400">אין לקוחות</li>}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsPage;
