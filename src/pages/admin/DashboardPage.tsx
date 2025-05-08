"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, isToday } from "date-fns";
import { he } from "date-fns/locale";
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import useStore from "../../store/useStore";

interface Appointment {
  id: string;
  clientName: string;
  serviceName: string;
  startTime: Date;
  status: string;
  price: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  created: Date;
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const businessId = user?.businessId;
  const [ownerName, setOwnerName] = useState<string>(''); // State עבור שם בעלת העסק

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch owner name
        const ownerDocRef = doc(db, "users", businessId);
        const ownerDoc = await getDoc(ownerDocRef);
        if (ownerDoc.exists()) {
          setOwnerName(ownerDoc.data().name || "ישראל"); // הגדרת שם בעלת העסק
        }

        // Fetch appointments
        const apptQuery = query(
          collection(db, "appointments"),
          where("businessId", "==", businessId)
        );
        const apptSnapshot = await getDocs(apptQuery);
        const apptList = apptSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            clientName: data.clientName || "",
            serviceName: data.serviceName || "",
            startTime: (data.startTime as Timestamp).toDate(),
            status: data.status || "pending",
            price: data.price || 0,
          };
        }) as Appointment[];
        setAppointments(apptList);

        // Fetch clients
        const clientQuery = query(
          collection(db, "clients"),
          where("businessId", "==", businessId)
        );
        const clientSnapshot = await getDocs(clientQuery);
        const clientList = clientSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            phone: data.phone,
            created: data.created
              ? (data.created as Timestamp).toDate()
              : new Date(),
          };
        }) as Client[];
        setClients(clientList);
      } catch (error) {
        console.error("שגיאה בטעינת הנתונים:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  const todayAppointments = appointments.filter((a) =>
    isToday(a.startTime)
  );
  const confirmedAppointments = appointments.filter(
    (a) => a.status === "confirmed"
  );
  const completionRate =
    appointments.length > 0
      ? Math.round((confirmedAppointments.length / appointments.length) * 100)
      : 0;
  const monthlyIncome = confirmedAppointments.reduce(
    (sum, a) => sum + a.price,
    0
  );
  const recentClients = [...clients]
    .sort((a, b) => b.created.getTime() - a.created.getTime())
    .slice(0, 3);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {/* הצגת שם בעלת העסק ישירות */}
          {`שלום ${ownerName}`} 
        </h1>
        <p className="text-gray-600">
          הנה סקירה של העסק שלך להיום,{" "}
          {format(new Date(), "EEEE, d בMMMM yyyy", { locale: he })}
        </p>
      </div>

      {/* תצוגת סטטיסטיקות כמו מספר תורים, לקוחות, הכנסות חודשיות */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[ 
          {
            title: t("today_appointments"),
            value: todayAppointments.length,
            icon: <Calendar className="w-8 h-8 text-primary-200" />,
            color: "from-primary-600 to-primary-700",
          },
          {
            title: t("total_clients"),
            value: clients.length,
            icon: <Users className="w-8 h-8 text-primary-200" />,
            color: "from-secondary-600 to-secondary-700",
          },
          {
            title: t("monthly_income"),
            value: `₪${monthlyIncome}`,
            icon: <CreditCard className="w-8 h-8 text-primary-200" />,
            color: "from-success-600 to-success-700",
          },
          {
            title: "אחוז השלמת תורים",
            value: `${completionRate}%`,
            icon: <TrendingUp className="w-8 h-8 text-primary-200" />,
            color: "from-accent-600 to-accent-700",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-r ${stat.color} rounded-lg p-6 text-white shadow flex justify-between items-center`}
          >
            <div>
              <p className="text-sm text-white opacity-80">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className="p-3 rounded-full bg-white bg-opacity-20">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{t("today_appointments")}</h2>
            </div>
            <div className="p-4">
              {todayAppointments.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="py-4 px-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{appointment.clientName}</p>
                          <p className="text-sm text-gray-600">
                            {appointment.serviceName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {format(appointment.startTime, "HH:mm")}
                          </p>
                          <div className="flex items-center mt-1">
                            {appointment.status === "confirmed" ? (
                              <CheckCircle className="w-4 h-4 text-success-500 mr-1" />
                            ) : (
                              <Clock className="w-4 h-4 text-warning-500 mr-1" />
                            )}
                            <span
                              className={`text-xs ${
                                appointment.status === "confirmed"
                                  ? "text-success-600"
                                  : "text-warning-600"
                              }`}
                            >
                              {appointment.status === "confirmed"
                                ? t("status_confirmed")
                                : t("status_pending")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">אין תורים נוספים להיום</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">לקוחות אחרונים</h2>
            </div>
            <div className="p-4">
              {recentClients.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentClients.map((client) => (
                    <div key={client.id} className="py-4 px-2">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>
                          נרשם בתאריך:{" "}
                          {format(client.created, "d בMMM", { locale: he })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">אין לקוחות להצגה</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
