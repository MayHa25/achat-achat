import { create } from 'zustand';
import {
  Appointment,
  Business,
  Client,
  Service,
  Availability,
  BlockedTime,
} from '../types';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  businessId: string;
}

interface AppState {
  // User & Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  // Business
  business: Business | null;
  setBusiness: (business: Business | null) => void;

  // Services
  services: Service[];
  setServices: (services: Service[]) => void;
  addService: (service: Service) => void;
  updateService: (service: Service) => void;
  deleteService: (id: string) => void;

  // Availability
  availabilities: Availability[];
  setAvailabilities: (availabilities: Availability[]) => void;
  updateAvailability: (availability: Availability) => void;

  // Blocked times
  blockedTimes: BlockedTime[];
  setBlockedTimes: (blockedTimes: BlockedTime[]) => void;
  addBlockedTime: (blockedTime: BlockedTime) => void;
  deleteBlockedTime: (id: string) => void;

  // Appointments
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  deleteAppointment: (id: string) => void;

  // Clients
  clients: Client[];
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
}

const useStore = create<AppState>((set) => ({
  // User & Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
  }),

  // Business
  business: null,
  setBusiness: (business) => set({ business }),

  // Services
  services: [],
  setServices: (services) => set({ services }),
  addService: (service) => set((state) => ({
    services: [...state.services, service],
  })),
  updateService: (service) => set((state) => ({
    services: state.services.map((s) => (s.id === service.id ? service : s)),
  })),
  deleteService: (id) => set((state) => ({
    services: state.services.filter((s) => s.id !== id),
  })),

  // Availability
  availabilities: [],
  setAvailabilities: (availabilities) => set({ availabilities }),
  updateAvailability: (availability) => set((state) => ({
    availabilities: state.availabilities.map((a) =>
      a.id === availability.id ? availability : a
    ),
  })),

  // Blocked times
  blockedTimes: [],
  setBlockedTimes: (blockedTimes) => set({ blockedTimes }),
  addBlockedTime: (blockedTime) => set((state) => ({
    blockedTimes: [...state.blockedTimes, blockedTime],
  })),
  deleteBlockedTime: (id) => set((state) => ({
    blockedTimes: state.blockedTimes.filter((bt) => bt.id !== id),
  })),

  // Appointments
  appointments: [],
  setAppointments: (appointments) => set({ appointments }),
  addAppointment: (appointment) => set((state) => ({
    appointments: [...state.appointments, appointment],
  })),
  updateAppointment: (appointment) => set((state) => ({
    appointments: state.appointments.map((a) =>
      a.id === appointment.id ? appointment : a
    ),
  })),
  deleteAppointment: (id) => set((state) => ({
    appointments: state.appointments.filter((a) => a.id !== id),
  })),

  // Clients
  clients: [],
  setClients: (clients) => set({ clients }),
  addClient: (client) => set((state) => ({
    clients: [...state.clients, client],
  })),
  updateClient: (client) => set((state) => ({
    clients: state.clients.map((c) =>
      c.id === client.id ? client : c
    ),
  })),

  // UI State
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  selectedDate: null,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));

export default useStore;
