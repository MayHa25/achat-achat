"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useStore from "../../store/useStore";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface PaymentRecord {
  id: string;
  clientName: string;
  serviceName: string;
  price: number;
  status: string;
  date: Date;
}

const PaymentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const businessId = user?.businessId;

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchPayments = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "appointments"),
          where("businessId", "==", businessId)
        );
        const snapshot = await getDocs(q);
        const paymentList = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            if (!data.price || !data.status || data.status !== "paid") return null;

            return {
              id: doc.id,
              clientName: data.clientName || "לקוח לא ידוע",
              serviceName: data.serviceName || "שירות",
              price: data.price || 0,
              status: data.status,
              date: (data.startTime as Timestamp)?.toDate() || new Date(),
            };
          })
          .filter((p) => p !== null) as PaymentRecord[];

        setPayments(paymentList);
      } catch (error) {
        console.error("שגיאה בטעינת תשלומים:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [businessId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("payments.title", "תשלומים")}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <p className="text-gray-600">{t("loading", "טוען...")}</p>
        ) : payments.length === 0 ? (
          <p className="text-gray-500">לא נמצאו תשלומים.</p>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-right">תאריך</th>
                <th className="px-4 py-2 text-right">לקוח</th>
                <th className="px-4 py-2 text-right">שירות</th>
                <th className="px-4 py-2 text-right">סכום</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-4 py-2 text-right">{format(p.date, "d בMMMM yyyy", { locale: he })}</td>
                  <td className="px-4 py-2 text-right">{p.clientName}</td>
                  <td className="px-4 py-2 text-right">{p.serviceName}</td>
                  <td className="px-4 py-2 text-right">₪{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
