// src/pages/admin/ClientsPage.tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  writeBatch,
  deleteField,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useStore from '../../store/useStore';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created?: Timestamp;
  visitCount: number;
  totalAmount: number;
  status: string;
}

const ClientsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // קובע סטטוס לפי מספר הביקורים
  const determineClientStatus = (visitCount: number): string => {
    if (visitCount >= 5) return 'VIP';
    if (visitCount >= 3) return 'קבוע';
    return 'מזדמן';
  };

  // מעדכן סטטיסטיקות של לקוח בודד
  const updateClientData = async (clientId: string, amount: number) => {
    const clientRef = doc(db, 'clients', clientId);
    const snap = await getDoc(clientRef);
    const data = snap.data() || {};
    const currentVisits = typeof data.visitCount === 'number' ? data.visitCount : 0;
    const newVisits = currentVisits + 1;
    const status = determineClientStatus(newVisits);

    await updateDoc(clientRef, {
      visitCount: increment(1),
      totalAmount: increment(amount),
      status
    });
  };

  // משחרר את businessId מכל הלקוחות הקיימים ומיועד אותו ללקוח החדש
  const reassignBusinessId = async (newClientId: string) => {
    if (!user?.businessId) return;
    const batch = writeBatch(db);

    // שולף את כל הלקוחות שמשויכים כרגע אליך
    const prevSnap = await getDocs(
      query(collection(db, 'clients'), where('businessId', '==', user.businessId))
    );
    prevSnap.docs.forEach(docSnap => {
      if (docSnap.id !== newClientId) {
        batch.update(doc(db, 'clients', docSnap.id), {
          businessId: deleteField()
        });
      }
    });

    // מייחס את ה-businessId ללקוח החדש
    batch.update(doc(db, 'clients', newClientId), {
      businessId: user.businessId
    });

    await batch.commit();
  };

  // טוען את רשימת הלקוחות המשויכים אליך
  const fetchClients = async () => {
    if (!user?.businessId) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'clients'), where('businessId', '==', user.businessId)));
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Client, 'id'>) }));
      setClients(list);
    } catch (err) {
      console.error('שגיאה בטעינת לקוחות:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user?.businessId]);

  // מחיקת לקוח
  const handleDeleteClient = async (clientId: string) => {
    const confirm = window.confirm('האם אתה בטוח שברצונך למחוק את הלקוח?');
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      setClients(prev => prev.filter(c => c.id !== clientId));
    } catch (err) {
      console.error('שגיאה במחיקת לקוח:', err);
      alert('אירעה שגיאה במחיקת הלקוח. אנא נסה שוב.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">{t('clients.title', 'לקוחות')}</h1>
      <p className="text-gray-600 mb-4">סה"כ לקוחות: {clients.length}</p>
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <p className="text-gray-500">{t('loading', 'טוען...')}</p>
        ) : clients.length === 0 ? (
          <p className="text-gray-600">{t('clients.noClients', 'לא נמצאו לקוחות.')}</p>
        ) : (
          <ul className="space-y-4">
            {clients.map(client => (
              <li key={client.id} className="border-b pb-2 flex justify-between items-start">
                <div>
                  <p className="font-semibold">{client.name}</p>
                  <p className="text-sm text-gray-600">{client.phone}</p>
                  {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
                  {client.created && (
                    <p className="text-xs text-gray-400">
                      נוצר בתאריך: {client.created.toDate().toLocaleDateString('he-IL')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">הגעות: {client.visitCount}</p>
                  <p className="text-xs text-gray-400">סה"כ שילם: ₪{client.totalAmount}</p>
                  <p className="text-xs text-gray-400">סטטוס: {client.status}</p>
                </div>
                <button
                  onClick={() => handleDeleteClient(client.id)}
                  className="text-red-600 text-sm font-medium ml-4"
                >
                  מחק
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;
