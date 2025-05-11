export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'client';
  businessId?: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  description?: string;
  businessType: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  active: boolean;
}

export interface Availability {
  id: string;
  businessId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  available: boolean;
}

export interface BlockedTime {
  id: string;
  businessId: string;
  startTime: Date;
  endTime: Date;
  reason?: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'credit' | 'bit' | 'cash';
  invoiceId?: string;
}

export interface Client {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created: Date;
  lastVisit?: Date;
}

export interface ClientNote {
  id: string;
  clientId: string;
  businessId: string;
  note: string;
  created: Date;
}

export interface Payment {
  id: string;
  appointmentId: string;
  businessId: string;
  clientId: string;
  amount: number;
  method: 'credit' | 'bit' | 'cash';
  status: 'pending' | 'completed' | 'refunded';
  date: Date;
  invoiceId?: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  clientId: string;
  appointmentId: string;
  paymentId: string;
  invoiceNumber: string;
  amount: number;
  date: Date;
  items: InvoiceItem[];
  status: 'issued' | 'cancelled';
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}