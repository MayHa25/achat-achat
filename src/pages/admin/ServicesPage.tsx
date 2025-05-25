import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useStore from '../../store/useStore';
import ImageUpload from './ImageUpload';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  notes?: string;
  gallery?: string[];
}

const ServicesPage: React.FC = () => {
  const { user } = useStore();
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Service>>({});
  const [newService, setNewService] = useState({
    name: '',
    price: 0,
    duration: 30,
    notes: ''
  });

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'), where('businessId', '==', user.businessId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
        setServices(data);
      } catch (error) {
        console.error('שגיאה בטעינת שירותים:', error);
      }
    };

    fetchServices();
  }, [user?.businessId]);

  const handleAddService = async () => {
    if (!newService.name || !user?.businessId) return;

    try {
      const docRef = await addDoc(collection(db, 'services'), {
        ...newService,
        businessId: user.businessId
      });

      setServices(prev => [...prev, { ...newService, id: docRef.id }]);
      setNewService({ name: '', price: 0, duration: 30, notes: '' });
    } catch (error) {
      console.error('שגיאה בהוספת שירות:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('שגיאה במחיקת שירות:', error);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setEditValues({ ...service });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editValues) return;

    try {
      await updateDoc(doc(db, 'services', editingId), editValues);
      setServices(prev =>
        prev.map(s => (s.id === editingId ? { ...s, ...editValues } : s))
      );
      setEditingId(null);
      setEditValues({});
    } catch (error) {
      console.error('שגיאה בעדכון שירות:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ניהול שירותים</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">הוספת שירות חדש</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="שם השירות"
            value={newService.name}
            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            className="border px-3 py-2 rounded"
          />
          <input
            type="number"
            placeholder="מחיר"
            value={newService.price}
            onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
            className="border px-3 py-2 rounded"
          />
          <input
            type="number"
            placeholder="משך (בדקות)"
            value={newService.duration}
            onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
            className="border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="הערות"
            value={newService.notes}
            onChange={(e) => setNewService({ ...newService, notes: e.target.value })}
            className="border px-3 py-2 rounded"
          />
        </div>
        <button
          onClick={handleAddService}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          הוסף שירות
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">רשימת שירותים</h2>
        {services.length === 0 ? (
          <p className="text-gray-600">אין שירותים במערכת</p>
        ) : (
          <ul className="space-y-4">
            {services.map(service => (
              <li key={service.id} className="border p-4 rounded">
                {editingId === service.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <input
                      type="text"
                      value={editValues.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      className="border px-2 py-1 rounded"
                    />
                    <input
                      type="number"
                      value={editValues.price}
                      onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                      className="border px-2 py-1 rounded"
                    />
                    <input
                      type="number"
                      value={editValues.duration}
                      onChange={(e) => setEditValues({ ...editValues, duration: Number(e.target.value) })}
                      className="border px-2 py-1 rounded"
                    />
                    <input
                      type="text"
                      value={editValues.notes}
                      onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                      className="border px-2 py-1 rounded"
                    />
                    <div className="flex flex-row-reverse gap-3">
                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800">שמור</button>
                      <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">ביטול</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{service.name}</p>
                        <p className="text-sm text-gray-500">
                          מחיר: ₪{service.price} | משך: {service.duration} דקות
                          {service.notes && ` | הערות: ${service.notes}`}
                        </p>
                      </div>
                      <div className="flex flex-row-reverse gap-4">
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          מחק
                        </button>
                      </div>
                    </div>
                    {(user?.plan === 'plus' || user?.plan === 'premium') && (
                      <div className="mt-4">
                        <ImageUpload serviceId={service.id} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
