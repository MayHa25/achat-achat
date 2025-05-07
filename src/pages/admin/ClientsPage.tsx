import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useStore from '../../store/useStore';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created?: Timestamp;
}

const ClientsPage = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchClients = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'clients'), where('businessId', '==', user.businessId));
        const snapshot = await getDocs(q);
        const clientList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Client, 'id'>),
        }));
        setClients(clientList);
      } catch (err) {
        console.error('שגיאה בטעינת לקוחות:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user?.businessId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">{t('clients.title', 'לקוחות')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <p className="text-gray-500">{t('loading', 'טוען...')}</p>
        ) : clients.length === 0 ? (
          <p className="text-gray-600">{t('clients.noClients', 'לא נמצאו לקוחות.')}</p>
        ) : (
          <ul className="space-y-4">
            {clients.map(client => (
              <li key={client.id} className="border-b pb-2">
                <p className="font-semibold">{client.name}</p>
                <p className="text-sm text-gray-600">{client.phone}</p>
                {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
                {client.created && (
                  <p className="text-xs text-gray-400">
                    נוצר בתאריך: {client.created.toDate().toLocaleDateString('he-IL')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;
