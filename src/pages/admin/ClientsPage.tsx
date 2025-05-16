// src/pages/admin/ClientsPage.tsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useStore from '../../store/useStore';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  visitCount: number;
  totalAmount: number;
  status?: string;
  lastVisit?: { seconds: number };
}

const ClientsPage: React.FC = () => {
  const { user } = useStore();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchClients = async () => {
      try {
        const q = query(
          collection(db, 'clients'),
          where('businessId', '==', user.businessId)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as Client[];

        setClients(data);
      } catch (error) {
        console.error('שגיאה בטעינת לקוחות:', error);
      }
    };

    fetchClients();
  }, [user?.businessId]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'VIP':
        return 'bg-yellow-500 text-white';
      case 'קבוע':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">לקוחות</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {clients.length === 0 ? (
          <p className="text-gray-600">לא נמצאו לקוחות</p>
        ) : (
          <div className="space-y-4">
            {clients.map(client => (
              <div
                key={client.id}
                className="flex justify-between items-center border-b pb-3"
              >
                <div>
                  <p className="font-medium text-lg">{client.name}</p>
                  <p className="text-sm text-gray-500">
                    ביקורים: {client.visitCount} | סה"כ תשלום: ₪{client.totalAmount}
                    <br />
                    ביקור אחרון: {' '}
                    {client.lastVisit?.seconds
                      ? format(
                          new Date(client.lastVisit.seconds * 1000),
                          'd בMMM yyyy',
                          { locale: he }
                        )
                      : 'לא ידוע'}
                  </p>
                  {client.phone && (
                    <p className="text-sm text-gray-400">טלפון: {client.phone}</p>
                  )}
                  {client.email && (
                    <p className="text-sm text-gray-400">אימייל: {client.email}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                    client.status || 'מזדמן'
                  )}`}
                >
                  {client.status || 'מזדמן'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;
