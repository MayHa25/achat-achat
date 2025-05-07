"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import useStore from "../../store/useStore";
import { useTranslation } from "react-i18next";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

const ServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const businessId = user?.businessId;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    duration: "",
    description: "",
  });

  useEffect(() => {
    if (!businessId) return;

    const fetchServices = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "services"), where("businessId", "==", businessId));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as Service[];
        setServices(list);
      } catch (error) {
        console.error("שגיאה בטעינת שירותים:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [businessId]);

  const handleAddService = async () => {
    if (!newService.name || !newService.price || !newService.duration) return;
    try {
      const docRef = await addDoc(collection(db, "services"), {
        businessId,
        name: newService.name,
        price: Number(newService.price),
        duration: Number(newService.duration),
        description: newService.description,
      });
      setServices((prev) => [
        ...prev,
        {
          id: docRef.id,
          name: newService.name,
          price: Number(newService.price),
          duration: Number(newService.duration),
          description: newService.description,
        },
      ]);
      setNewService({ name: "", price: "", duration: "", description: "" });
    } catch (err) {
      console.error("שגיאה בהוספת שירות:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "services", id));
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("שגיאה במחיקת שירות:", err);
    }
  };

  const handleEdit = async (
    id: string,
    field: keyof Service,
    value: string
  ) => {
    const service = services.find((s) => s.id === id);
    if (!service) return;

    const updated = {
      ...service,
      [field]: field === "price" || field === "duration" ? Number(value) : value,
    };
    try {
      await updateDoc(doc(db, "services", id), updated);
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: updated[field] } : s))
      );
    } catch (err) {
      console.error("שגיאה בעדכון שירות:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t("services.title", "שירותים")}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <p className="text-gray-600">טוען שירותים...</p>
        ) : (
          <ul className="space-y-4">
            {services.map((service) => (
              <li key={service.id} className="border-b pb-4">
                <div className="flex flex-col gap-2">
                  <input
                    className="border px-4 py-2 rounded"
                    value={service.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEdit(service.id, "name", e.target.value)
                    }
                    placeholder="שם השירות"
                  />
                  <input
                    className="border px-4 py-2 rounded"
                    type="number"
                    value={service.price.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEdit(service.id, "price", e.target.value)
                    }
                    placeholder="מחיר (₪)"
                  />
                  <input
                    className="border px-4 py-2 rounded"
                    type="number"
                    value={service.duration.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEdit(service.id, "duration", e.target.value)
                    }
                    placeholder="משך בדקות"
                  />
                  <input
                    className="border px-4 py-2 rounded"
                    value={service.description || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleEdit(service.id, "description", e.target.value)
                    }
                    placeholder="תיאור"
                  />
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-fit"
                    onClick={() => handleDelete(service.id)}
                  >
                    מחיקה
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <hr className="my-6" />
        <h2 className="font-semibold mb-4">הוספת שירות חדש</h2>
        <div className="flex flex-col gap-4">
          <input
            className="border px-4 py-2 rounded"
            value={newService.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewService({ ...newService, name: e.target.value })
            }
            placeholder="שם השירות"
          />
          <input
            className="border px-4 py-2 rounded"
            type="number"
            value={newService.price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewService({ ...newService, price: e.target.value })
            }
            placeholder="מחיר (₪)"
          />
          <input
            className="border px-4 py-2 rounded"
            type="number"
            value={newService.duration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewService({ ...newService, duration: e.target.value })
            }
            placeholder="משך בדקות"
          />
          <input
            className="border px-4 py-2 rounded"
            value={newService.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewService({ ...newService, description: e.target.value })
            }
            placeholder="תיאור"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-fit"
            onClick={handleAddService}
          >
            הוסף שירות
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
