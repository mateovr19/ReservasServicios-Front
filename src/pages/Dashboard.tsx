import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  Search,
  Bell,
  Clock,
  Check,
  X,
  AlertCircle,
  Info,
  CalendarDays
} from 'lucide-react';
import api from '../api/axios';
import axios from 'axios';
import './Dashboard.css';

// Types matching Backend schemas
interface Offer {
  serviceId: number;
  serviceName: string;
  serviceDescription: string;
  providerName: string;
  providerId: number;
}

interface Availability {
  availabilityId: number;
  startTime: string;
  endTime: string;
  remainingSlots: number;
  fecha?: string;
}

interface CustomerReservation {
  bookingId: number;
  serviceId: number;
  serviceName: string;
  providerId: number;
  providerFullName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  bookingStatus: string;
  createdAt: string;
}

interface ProviderBooking {
  bookingId: number;
  serviceId: number;
  serviceName: string;
  availabilityId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  customerId: number;
  customerFullName: string;
  customerEmail: string;
  bookingStatus: string;
  createdAt: string;
}

interface ServiceItem {
  idServicio: number;
  nombre: string;
  descripcion: string;
  duracionMinutos: number;
  capacidadMaximaConcurrente: number;
  estadoServicio: 'ACTIVO' | 'INACTIVO' | string;
}

interface GeneralScheduleDay {
  dayOfWeek: string;
  horaInicio: string;
  horaFin: string;
}

interface RawBookingData {
  bookingId?: number;
  idReserva?: number;
  id?: number;
  serviceId?: number;
  idServicio?: number;
  serviceName?: string;
  nombreServicio?: string;
  availabilityId?: number;
  idDisponibilidad?: number;
  slotDate?: string;
  fechaReserva?: string;
  fecha?: string;
  startTime?: string;
  horaInicio?: string;
  endTime?: string;
  horaFin?: string;
  customerId?: number;
  idCliente?: number;
  customerFullName?: string;
  nombreCliente?: string;
  customerEmail?: string;
  correoCliente?: string;
  bookingStatus?: string;
  estadoReserva?: string;
  estado?: string;
  createdAt?: string;
  fechaCreacion?: string;
  providerId?: number;
  idProveedor?: number;
  providerFullName?: string;
  nombreProveedor?: string;
}

interface RawAvailabilityData {
  availabilityId?: number;
  idDisponibilidad?: number;
  startTime?: string;
  horaInicio?: string;
  endTime?: string;
  horaFin?: string;
  remainingSlots?: number | null;
  cuposDisponibles?: number;
  fecha?: string;
}

interface RawOfferData {
  serviceId?: number;
  idServicio?: number;
  id?: number;
  serviceName?: string;
  nombreServicio?: string;
  nombre?: string;
  serviceDescription?: string;
  descripcion?: string;
  providerName?: string;
  nombreProveedor?: string;
  providerId?: number;
  idProveedor?: number;
  providerUserId?: number;
}

interface RawServiceData {
  serviceId?: number;
  idServicio?: number;
  id?: number;
  nombre?: string;
  serviceName?: string;
  descripcion?: string;
  serviceDescription?: string;
  duracionMinutos?: number;
  duration?: number;
  capacidadMaximaConcurrente?: number;
  capacity?: number;
  estadoServicio?: string;
  status?: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'services' | 'bookings' | 'offers'>('overview');
  
  // Global States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Provider States
  const [providerBookings, setProviderBookings] = useState<ProviderBooking[]>([]);
  const [myServices, setMyServices] = useState<ServiceItem[]>([]);
  const [generalSchedule, setGeneralSchedule] = useState<GeneralScheduleDay[]>([
    { dayOfWeek: 'LUNES', horaInicio: '08:00:00', horaFin: '17:00:00' },
    { dayOfWeek: 'MARTES', horaInicio: '08:00:00', horaFin: '17:00:00' },
    { dayOfWeek: 'MIERCOLES', horaInicio: '08:00:00', horaFin: '17:00:00' },
    { dayOfWeek: 'JUEVES', horaInicio: '08:00:00', horaFin: '17:00:00' },
    { dayOfWeek: 'VIERNES', horaInicio: '08:00:00', horaFin: '17:00:00' },
    { dayOfWeek: 'SABADO', horaInicio: '09:00:00', horaFin: '13:00:00' },
    { dayOfWeek: 'DOMINGO', horaInicio: '00:00:00', horaFin: '00:00:00' },
  ]);
  
  // Service form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceCapacity, setNewServiceCapacity] = useState(1);
  const [loadingService, setLoadingService] = useState(false);

  // Availability form state
  const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
  const [availDate, setAvailDate] = useState('');
  const [availStart, setAvailStart] = useState('08:00');
  const [availEnd, setAvailEnd] = useState('08:30');
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availabilitiesList, setAvailabilitiesList] = useState<Record<number, Availability[]>>({});

  // Client States
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientBookings, setClientBookings] = useState<CustomerReservation[]>([]);
  
  // Client booking modal / panel state
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<Availability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);

  // Rescheduling state
  const [reschedulingBooking, setReschedulingBooking] = useState<CustomerReservation | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [rescheduleSlots, setRescheduleSlots] = useState<Availability[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);

  // Fetch functions memoized to avoid dependency loops
  const fetchProviderBookings = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/providers/me/bookings');
      const rawData: RawBookingData[] = response.data?.data || [];
      const normalizedData = rawData.map((item: RawBookingData) => ({
        bookingId: item.bookingId || item.idReserva || item.id || Date.now(),
        serviceId: item.serviceId || item.idServicio || 0,
        serviceName: item.serviceName || item.nombreServicio || 'Servicio Reservado',
        availabilityId: item.availabilityId || item.idDisponibilidad || 0,
        slotDate: item.slotDate || item.fechaReserva || item.fecha || 'Sin fecha',
        startTime: item.startTime || item.horaInicio || '00:00:00',
        endTime: item.endTime || item.horaFin || '00:00:00',
        customerId: item.customerId || item.idCliente || 1,
        customerFullName: item.customerFullName || item.nombreCliente || 'Cliente',
        customerEmail: item.customerEmail || item.correoCliente || '',
        bookingStatus: item.bookingStatus || item.estadoReserva || item.estado || 'CREADA',
        createdAt: item.createdAt || item.fechaCreacion || new Date().toISOString()
      }));
      setProviderBookings(normalizedData);
    } catch (err) {
      console.error('Error fetching provider bookings', err);
    }
  }, []);

  const fetchClientBookings = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/bookings/me');
      const rawData: RawBookingData[] = response.data?.data || [];
      const normalizedData = rawData.map((item: RawBookingData) => ({
        bookingId: item.bookingId || item.idReserva || item.id || Date.now(),
        serviceId: item.serviceId || item.idServicio || 0,
        serviceName: item.serviceName || item.nombreServicio || 'Servicio Reservado',
        providerId: item.providerId || item.idProveedor || 1,
        providerFullName: item.providerFullName || item.nombreProveedor || 'Proveedor',
        slotDate: item.slotDate || item.fechaReserva || item.fecha || 'Sin fecha',
        startTime: item.startTime || item.horaInicio || '00:00:00',
        endTime: item.endTime || item.horaFin || '00:00:00',
        bookingStatus: item.bookingStatus || item.estadoReserva || item.estado || 'CREADA',
        createdAt: item.createdAt || item.fechaCreacion || new Date().toISOString()
      }));
      setClientBookings(normalizedData);
    } catch (err) {
      console.error('Error fetching client bookings', err);
    }
  }, []);

  const fetchServiceAvailabilities = async (serviceId: number) => {
    try {
      const providerId = user?.id || 1;
      const response = await api.get(
        `/api/v1/providers/${providerId}/services/${serviceId}/availabilities`,
        { params: { date: availDate } }
      );
      const rawData: RawAvailabilityData[] = response.data?.data || [];
      const normalizedData = rawData.map((item: RawAvailabilityData) => ({
        availabilityId: item.availabilityId || item.idDisponibilidad || 0,
        startTime: item.startTime || item.horaInicio || '00:00:00',
        endTime: item.endTime || item.horaFin || '00:00:00',
        remainingSlots: item.remainingSlots ?? item.cuposDisponibles ?? 0,
        fecha: item.fecha || ''
      }));
      setAvailabilitiesList(prev => ({
        ...prev,
        [serviceId]: normalizedData
      }));
    } catch (err) {
      console.error(`Error fetching availabilities for service ${serviceId}`, err);
    }
  };

  const fetchOffers = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/offers');
      const rawData: RawOfferData[] = response.data?.data || [];
      const normalizedOffers = rawData.map((item: RawOfferData) => ({
        serviceId: item.serviceId || item.idServicio || item.id || 0,
        serviceName: item.serviceName || item.nombreServicio || item.nombre || 'Servicio sin nombre',
        serviceDescription: item.serviceDescription || item.descripcion || 'Sin descripción',
        providerName: item.providerName || item.nombreProveedor || 'Proveedor',
        providerId: item.providerId || item.idProveedor || item.providerUserId || 1,
      }));
      setOffers(normalizedOffers);
    } catch (err) {
      console.error('Error fetching offers', err);
    }
  }, []);

  // Fetch initial data based on role
  useEffect(() => {
    if (user?.role === 'PROVEEDOR') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProviderBookings();
      // Load services from local storage since backend has no GET for provider's services
      const savedServices = localStorage.getItem(`services_${user.correo}`);
      if (savedServices) {
        setMyServices(JSON.parse(savedServices));
      }
      // Load schedule from local storage or backend if available
      const savedSchedule = localStorage.getItem(`schedule_${user.correo}`);
      if (savedSchedule) {
        setGeneralSchedule(JSON.parse(savedSchedule));
      }
    }
  }, [user?.role, user?.correo, fetchProviderBookings]);

  useEffect(() => {
    if (user?.role === 'CLIENTE') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchClientBookings();
      fetchOffers();
    }
  }, [user?.role, fetchClientBookings, fetchOffers]);

  // Save general schedule
  const handleUpdateSchedule = async (day: string, start: string, end: string) => {
    setError('');
    setSuccess('');
    try {
      const formattedStart = start.length === 5 ? `${start}:00` : start;
      const formattedEnd = end.length === 5 ? `${end}:00` : end;

      await api.put(`/api/v1/providers/me/general-schedule/${day}`, {
        horaInicio: formattedStart,
        horaFin: formattedEnd
      });

      const updated = generalSchedule.map(item => 
        item.dayOfWeek === day ? { ...item, horaInicio: formattedStart, horaFin: formattedEnd } : item
      );
      setGeneralSchedule(updated);
      localStorage.setItem(`schedule_${user?.correo}`, JSON.stringify(updated));
      setSuccess(`Horario de ${day} actualizado correctamente.`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al actualizar el horario.');
      } else {
        setError('Error inesperado.');
      }
    }
  };

  // Register service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingService(true);

    try {
      const response = await api.post<{ data: ServiceItem }>('/api/v1/providers/me/services', {
        nombre: newServiceName,
        descripcion: newServiceDesc,
        duracionMinutos: newServiceDuration,
        capacidadMaximaConcurrente: newServiceCapacity
      });

      const backendSrv = response.data.data as RawServiceData;
      const newService: ServiceItem = {
        idServicio: backendSrv.serviceId || backendSrv.idServicio || backendSrv.id || Date.now(),
        nombre: backendSrv.nombre || backendSrv.serviceName || newServiceName,
        descripcion: backendSrv.descripcion || backendSrv.serviceDescription || newServiceDesc,
        duracionMinutos: backendSrv.duracionMinutos || backendSrv.duration || newServiceDuration,
        capacidadMaximaConcurrente: backendSrv.capacidadMaximaConcurrente || backendSrv.capacity || newServiceCapacity,
        estadoServicio: backendSrv.estadoServicio || backendSrv.status || 'ACTIVO'
      };
      
      const updatedServices = [...myServices, newService];
      setMyServices(updatedServices);
      localStorage.setItem(`services_${user?.correo}`, JSON.stringify(updatedServices));
      
      setSuccess('Servicio registrado correctamente.');
      setNewServiceName('');
      setNewServiceDesc('');
      setNewServiceDuration(30);
      setNewServiceCapacity(1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al registrar el servicio.');
      } else {
        setError('Error inesperado.');
      }
    } finally {
      setLoadingService(false);
    }
  };

  // Toggle service status (Activo/Inactivo)
  const handleToggleServiceStatus = async (serviceId: number, currentStatus: string) => {
    setError('');
    setSuccess('');
    const targetStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await api.patch(`/api/v1/providers/me/services/${serviceId}/status`, {
        targetStatus
      });

      const updated = myServices.map(srv => 
        srv.idServicio === serviceId ? { ...srv, estadoServicio: targetStatus } : srv
      );
      setMyServices(updated);
      localStorage.setItem(`services_${user?.correo}`, JSON.stringify(updated));
      setSuccess('Estado del servicio actualizado correctamente.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cambiar estado.');
      } else {
        setError('Error inesperado.');
      }
    }
  };

  // Register availability slot for provider
  const handleCreateAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedServiceId) {
      setError('Debes seleccionar un servicio.');
      return;
    }
    if (!availDate) {
      setError('Debes seleccionar una fecha.');
      return;
    }

    setLoadingAvail(true);
    try {
      const formattedStart = availStart.length === 5 ? `${availStart}:00` : availStart;
      const formattedEnd = availEnd.length === 5 ? `${availEnd}:00` : availEnd;

      const response = await api.post<{ data: Availability }>(
        `/api/v1/providers/me/services/${selectedServiceId}/availabilities`,
        {
          fecha: availDate,
          horaInicio: formattedStart,
          horaFin: formattedEnd
        }
      );

      const backendData = response.data.data as RawAvailabilityData;
      const newAvail: Availability = {
        availabilityId: backendData.availabilityId || backendData.idDisponibilidad || 0,
        startTime: backendData.startTime || backendData.horaInicio || formattedStart,
        endTime: backendData.endTime || backendData.horaFin || formattedEnd,
        remainingSlots: backendData.remainingSlots ?? backendData.cuposDisponibles ?? 1,
        fecha: availDate
      };
      
      const currentList = availabilitiesList[Number(selectedServiceId)] || [];
      const updatedList = [...currentList, newAvail];
      setAvailabilitiesList({
        ...availabilitiesList,
        [Number(selectedServiceId)]: updatedList
      });

      setSuccess('Franja de disponibilidad creada correctamente.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al crear disponibilidad (posible superposición).');
      } else {
        setError('Error inesperado.');
      }
    } finally {
      setLoadingAvail(false);
    }
  };

  // Block availability slot for provider
  const handleBlockAvailability = async (serviceId: number, availabilityId: number) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/v1/providers/me/services/${serviceId}/availabilities/${availabilityId}/block`);
      
      // Update local state
      const currentList = availabilitiesList[serviceId] || [];
      const updatedList = currentList.map(av => 
        av.availabilityId === availabilityId ? { ...av, remainingSlots: 0 } : av
      );
      setAvailabilitiesList({
        ...availabilitiesList,
        [serviceId]: updatedList
      });

      setSuccess('Franja de disponibilidad bloqueada.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al bloquear disponibilidad.');
      } else {
        setError('Error inesperado.');
      }
    }
  };

  // Finalize booking (Provider side)
  const handleFinalizeBooking = async (bookingId: number) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/v1/providers/me/bookings/${bookingId}/finalization`);
      setProviderBookings(prev => 
        prev.map(b => b.bookingId === bookingId ? { ...b, bookingStatus: 'FINALIZADA' } : b)
      );
      setSuccess('Reserva finalizada correctamente.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al finalizar la reserva.');
      } else {
        setError('Error inesperado.');
      }
    }
  };

  // Query Available Hours/Slots for a client (Workaround Scanner for missing providerId)
  const fetchAvailableSlots = async (serviceId: number, date: string, providerId: number) => {
    setLoadingSlots(true);
    setError('');
    setAvailableSlots([]);

    try {
        const response = await api.get(
            `/api/v1/providers/${providerId}/services/${serviceId}/availabilities`,
            { params: { date } }
        );
        const rawData: RawAvailabilityData[] = response.data?.data || [];
        const normalizedData = rawData.map((item: RawAvailabilityData) => ({
            availabilityId: item.availabilityId || item.idDisponibilidad || 0,
            startTime: item.startTime || item.horaInicio || '00:00:00',
            endTime: item.endTime || item.horaFin || '00:00:00',
            remainingSlots: item.remainingSlots ?? item.cuposDisponibles ?? 0,
            fecha: item.fecha || ''
        }));
        setAvailableSlots(normalizedData);
    } catch {
        setError('Error al obtener horarios disponibles.');
        setAvailableSlots([]);
    } finally {
        setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedOffer && bookingDate) {
        fetchAvailableSlots(selectedOffer.serviceId, bookingDate, selectedOffer.providerId);
    }
  }, [selectedOffer, bookingDate]);

  // Create booking (Client side)
  const handleCreateBooking = async (availabilityId: number) => {
    if (!selectedOffer) return;
    setError('');
    setSuccess('');
    setLoadingBooking(true);
    try {
      const providerId = selectedOffer.providerId;
      await api.post('/api/v1/bookings', {
        providerId,
        serviceId: selectedOffer.serviceId,
        availabilityId
      });

      setSuccess('¡Reserva creada con éxito!');
      fetchClientBookings();
      setSelectedOffer(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al procesar la reserva. Inténtalo más tarde.');
      } else {
        setError('Error inesperado al crear reserva.');
      }
    } finally {
      setLoadingBooking(false);
    }
  };

  // Cancel booking (Client side)
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    setError('');
    setSuccess('');
    try {
      console.log('Cancelando reserva con ID:', bookingId);
      await api.patch(`/api/v1/bookings/${bookingId}/cancellation`);
      setClientBookings(prev => 
        prev.map(b => b.bookingId === bookingId ? { ...b, bookingStatus: 'CANCELADA' } : b)
      );
      setSuccess('Reserva cancelada correctamente.');
      alert('✅ Reserva cancelada correctamente.');
      // Refrescar la lista completa desde el servidor
      fetchClientBookings();
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err)
        ? (err.response?.data?.message || `Error del servidor: ${err.response?.status}`)
        : 'Error inesperado al cancelar.';
      console.error('Error cancelando reserva:', err);
      setError(errorMsg);
      alert('❌ Error al cancelar: ' + errorMsg);
    }
  };

  // Query slots for rescheduling
  const fetchRescheduleSlots = async (providerId: number, serviceId: number, date: string) => {
    setLoadingRescheduleSlots(true);
    try {
      const response = await api.get<{ data: Availability[] }>(
        `/api/v1/providers/${providerId}/services/${serviceId}/availabilities`,
        { params: { date } }
      );
      const rawData: RawAvailabilityData[] = response.data.data || [];
      const normalizedData = rawData.map((item: RawAvailabilityData) => ({
        availabilityId: item.availabilityId || item.idDisponibilidad || 0,
        startTime: item.startTime || item.horaInicio || '00:00:00',
        endTime: item.endTime || item.horaFin || '00:00:00',
        remainingSlots: item.remainingSlots ?? item.cuposDisponibles ?? 0,
        fecha: item.fecha || ''
      }));
      setRescheduleSlots(normalizedData);
    } catch (err) {
      console.error(err);
      setRescheduleSlots([]);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  useEffect(() => {
    if (reschedulingBooking && rescheduleDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRescheduleSlots(reschedulingBooking.providerId, reschedulingBooking.serviceId, rescheduleDate);
    }
  }, [reschedulingBooking, rescheduleDate]);

  // Reschedule booking (Client side)
  const handleRescheduleBooking = async (newAvailabilityId: number) => {
    if (!reschedulingBooking) return;
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/v1/bookings/${reschedulingBooking.bookingId}/reschedule`, {
        availabilityId: newAvailabilityId
      });

      setSuccess('Reserva reprogramada correctamente.');
      fetchClientBookings();
      setReschedulingBooking(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al reprogramar la reserva.');
      } else {
        setError('Error inesperado.');
      }
    }
  };

  // Filter offers based on search
  const filteredOffers = offers.filter(offer => 
    offer.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.serviceDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.providerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon"></span>
            <span className="logo-text">ReservasApp</span>
          </div>
        </div>

        <div className="user-profile-badge">
          <div className="avatar">
            {user?.nombres_usuario ? user.nombres_usuario.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <h4 className="user-name">{user?.nombres_usuario}</h4>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Resumen</span>
          </button>

          {user?.role === 'PROVEEDOR' ? (
            <>
              <button 
                onClick={() => setActiveTab('schedule')} 
                className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
              >
                <Clock size={20} />
                <span>Horarios Atención</span>
              </button>
              <button 
                onClick={() => setActiveTab('services')} 
                className={`nav-item ${activeTab === 'services' ? 'active' : ''}`}
              >
                <Settings size={20} />
                <span>Servicios y Cupos</span>
              </button>
              <button 
                onClick={() => setActiveTab('bookings')} 
                className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
              >
                <Calendar size={20} />
                <span>Gestión Reservas</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('offers')} 
                className={`nav-item ${activeTab === 'offers' ? 'active' : ''}`}
              >
                <Search size={20} />
                <span>Buscar Servicios</span>
              </button>
              <button 
                onClick={() => setActiveTab('bookings')} 
                className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
              >
                <Calendar size={20} />
                <span>Mis Reservas</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-button">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-title">
            <h1>Panel de Control</h1>
          </div>
          <div className="header-actions">
            <button className="icon-btn"><Bell size={20} /></button>
            <div className="user-profile">
              <div className="avatar">
                {user?.nombres_usuario ? user.nombres_usuario.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Global Feedback Notifications */}
        {error && (
          <div className="alert-message error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="close-alert"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="alert-message success">
            <Check size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="close-alert"><X size={16} /></button>
          </div>
        )}

        <section className="dashboard-content">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <div className="welcome-banner">
                <h2>¡Hola de nuevo, {user?.nombres_usuario}!</h2>
                <p>Bienvenido a tu panel de control como <strong>{user?.role?.toLowerCase()}</strong>.</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Reservas</h3>
                  <p className="stat-value">
                    {user?.role === 'PROVEEDOR' ? providerBookings.length : clientBookings.length}
                  </p>
                  <span className="stat-trend">Totales en sistema</span>
                </div>
                <div className="stat-card">
                  <h3>{user?.role === 'PROVEEDOR' ? 'Servicios creados' : 'Reservas Activas'}</h3>
                  <p className="stat-value">
                    {user?.role === 'PROVEEDOR' 
                      ? myServices.length 
                      : clientBookings.filter(b => b.bookingStatus === 'CREADA').length}
                  </p>
                  <span className="stat-trend">Registrados</span>
                </div>
                <div className="stat-card">
                  <h3>Estado Cuenta</h3>
                  <p className="stat-value text-success">Activa</p>
                  <span className="stat-trend">Operativa</span>
                </div>
              </div>

              <div className="recent-activity-section">
                <h2>Actividad Reciente</h2>
                {user?.role === 'PROVEEDOR' ? (
                  <div className="activity-list">
                    {providerBookings.slice(0, 5).map((booking) => (
                      <div key={booking.bookingId} className="activity-item">
                        <div className="activity-icon-container bg-purple">
                          <Calendar size={18} />
                        </div>
                        <div className="activity-details">
                          <p className="activity-title">
                            Reserva de <strong>{booking.serviceName}</strong> por {booking.customerFullName}
                          </p>
                          <p className="activity-time">
                            Fecha: {booking.slotDate} | {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                        <span className={`activity-status ${booking.bookingStatus.toLowerCase()}`}>
                          {booking.bookingStatus}
                        </span>
                      </div>
                    ))}
                    {providerBookings.length === 0 && (
                      <p className="no-data">No tienes reservas registradas actualmente.</p>
                    )}
                  </div>
                ) : (
                  <div className="activity-list">
                    {clientBookings.slice(0, 5).map((booking) => (
                      <div key={booking.bookingId} className="activity-item">
                        <div className="activity-icon-container bg-purple">
                          <Calendar size={18} />
                        </div>
                        <div className="activity-details">
                          <p className="activity-title">
                            Reserva en <strong>{booking.serviceName}</strong> con {booking.providerFullName}
                          </p>
                          <p className="activity-time">
                            Fecha: {booking.slotDate} | {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                        <span className={`activity-status ${booking.bookingStatus.toLowerCase()}`}>
                          {booking.bookingStatus}
                        </span>
                      </div>
                    ))}
                    {clientBookings.length === 0 && (
                      <p className="no-data">No has realizado reservas aún.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE (PROVIDER ONLY) */}
          {activeTab === 'schedule' && user?.role === 'PROVEEDOR' && (
            <div className="tab-pane">
              <div className="section-header">
                <h2>Horario General de Atención</h2>
                <p>Establece tus horas de inicio y fin semanales para cada día.</p>
              </div>

              <div className="schedule-list">
                {generalSchedule.map((day) => {
                  return (
                    <ScheduleRow 
                      key={day.dayOfWeek} 
                      day={day} 
                      onSave={handleUpdateSchedule} 
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SERVICES AND AVAILABILITY (PROVIDER ONLY) */}
          {activeTab === 'services' && user?.role === 'PROVEEDOR' && (
            <div className="tab-pane">
              <div className="services-grid-layout">
                {/* Column 1: Register Service */}
                <div className="card-panel">
                  <h3>Registrar Nuevo Servicio</h3>
                  <form onSubmit={handleCreateService} className="vertical-form">
                    <div className="form-group">
                      <label>Nombre del Servicio</label>
                      <input 
                        type="text" 
                        value={newServiceName} 
                        onChange={(e) => setNewServiceName(e.target.value)} 
                        placeholder="Ej. Consulta Médica, Corte de Pelo"
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Descripción</label>
                      <textarea 
                        value={newServiceDesc} 
                        onChange={(e) => setNewServiceDesc(e.target.value)} 
                        placeholder="Describe lo que incluye tu servicio..."
                        required 
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Duración (Minutos)</label>
                        <input 
                          type="number" 
                          value={newServiceDuration} 
                          onChange={(e) => setNewServiceDuration(Number(e.target.value))} 
                          min={1} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label>Capacidad Simultánea</label>
                        <input 
                          type="number" 
                          value={newServiceCapacity} 
                          onChange={(e) => setNewServiceCapacity(Number(e.target.value))} 
                          min={1} 
                          required 
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loadingService}>
                      {loadingService ? 'Registrando...' : 'Registrar Servicio'}
                    </button>
                  </form>
                </div>

                {/* Column 2: Manage Availabilities */}
                <div className="card-panel">
                  <h3>Crear Disponibilidad Horaria</h3>
                  <form onSubmit={handleCreateAvailability} className="vertical-form">
                    <div className="form-group">
                      <label>Seleccionar Servicio</label>
                      <select 
                        value={selectedServiceId} 
                        onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : '')}
                        required
                      >
                        <option value="">-- Elige un servicio --</option>
                        {myServices.map(srv => (
                          <option key={srv.idServicio} value={srv.idServicio}>
                            {srv.nombre} ({srv.estadoServicio})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Fecha</label>
                      <input 
                        type="date" 
                        value={availDate} 
                        onChange={(e) => setAvailDate(e.target.value)} 
                        required 
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Hora Inicio</label>
                        <input 
                          type="time" 
                          value={availStart} 
                          onChange={(e) => setAvailStart(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label>Hora Fin</label>
                        <input 
                          type="time" 
                          value={availEnd} 
                          onChange={(e) => setAvailEnd(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-secondary" disabled={loadingAvail}>
                      {loadingAvail ? 'Creando...' : 'Crear Franja'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Service List */}
              <div className="my-services-section">
                <h2>Mis Servicios Registrados</h2>
                <div className="services-list-container">
                  {myServices.map((srv) => (
                    <div key={srv.idServicio} className="service-card-wrapper">
                      <div className="service-card">
                        <div className="service-card-info">
                          <h4>{srv.nombre}</h4>
                          <p>{srv.descripcion}</p>
                          <div className="service-card-meta">
                            <span><strong>Duración:</strong> {srv.duracionMinutos} min</span>
                            <span><strong>Capacidad:</strong> {srv.capacidadMaximaConcurrente} cupos</span>
                            <button 
                              type="button"
                              className="btn-ver-franjas-text"
                              onClick={() => fetchServiceAvailabilities(srv.idServicio)}
                            >
                              Ver Franjas ({availDate})
                            </button>
                          </div>
                        </div>
                        <div className="service-card-actions">
                          <span className={`status-badge ${srv.estadoServicio?.toLowerCase()}`}>
                            {srv.estadoServicio}
                          </span>
                          <button 
                            className={`btn-toggle-status ${srv.estadoServicio === 'ACTIVO' ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleServiceStatus(srv.idServicio, srv.estadoServicio)}
                          >
                            {srv.estadoServicio === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </div>

                      {availabilitiesList[srv.idServicio] && (
                        <div className="service-availabilities-block">
                          <h5>Franjas Horarias ({availDate}):</h5>
                          <div className="avail-slots-row">
                            {availabilitiesList[srv.idServicio].map((av) => (
                              <div key={av.availabilityId} className="avail-slot-pill">
                                <span className="slot-pill-time">{av.startTime?.substring(0, 5) || '00:00'} - {av.endTime?.substring(0, 5) || '00:00'}</span>
                                <span className="slot-pill-slots">({av.remainingSlots ?? 0} cupos)</span>
                                {(av.remainingSlots ?? 0) > 0 ? (
                                  <button 
                                    type="button"
                                    className="btn-block-slot"
                                    onClick={() => handleBlockAvailability(srv.idServicio, av.availabilityId)}
                                  >
                                    Bloquear
                                  </button>
                                ) : (
                                  <span className="blocked-text">Bloqueada</span>
                                )}
                              </div>
                            ))}
                            {availabilitiesList[srv.idServicio].length === 0 && (
                              <p className="no-data-small">No hay franjas creadas para esta fecha.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {myServices.length === 0 && (
                    <p className="no-data">No has registrado ningún servicio todavía.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BOOKINGS (PROVIDER AND CLIENT) */}
          {activeTab === 'bookings' && (
            <div className="tab-pane">
              <div className="section-header">
                <h2>Gestión de Reservas</h2>
                <p>Monitorea y cambia el estado de tus citas programadas.</p>
              </div>

              {user?.role === 'PROVEEDOR' ? (
                <div className="bookings-table-wrapper">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providerBookings.map((b) => (
                        <tr key={b.bookingId}>
                          <td><strong>{b.serviceName}</strong></td>
                          <td>
                            <div>{b.customerFullName}</div>
                            <small className="text-muted">{b.customerEmail}</small>
                          </td>
                          <td>{b.slotDate}</td>
                          <td>{b.startTime} - {b.endTime}</td>
                          <td>
                            <span className={`status-tag ${b.bookingStatus.toLowerCase()}`}>
                              {b.bookingStatus}
                            </span>
                          </td>
                          <td>
                            {b.bookingStatus === 'CREADA' && (
                              <button 
                                className="btn-table-action success"
                                onClick={() => handleFinalizeBooking(b.bookingId)}
                              >
                                Finalizar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {providerBookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center">No hay reservas programadas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bookings-table-wrapper">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th>Proveedor</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientBookings.map((b) => {
                        const status = (b.bookingStatus || '').toUpperCase();
                        const isCancellable = status !== 'CANCELADA' && status !== 'FINALIZADA' && status !== 'CANCELLED' && status !== 'COMPLETED';
                        return (
                        <tr key={b.bookingId}>
                          <td><strong>{b.serviceName}</strong></td>
                          <td>{b.providerFullName}</td>
                          <td>{b.slotDate}</td>
                          <td>{b.startTime?.substring(0, 5) || '00:00'} - {b.endTime?.substring(0, 5) || '00:00'}</td>
                          <td>
                            <span className={`status-tag ${b.bookingStatus?.toLowerCase()}`}>
                              {b.bookingStatus}
                            </span>
                          </td>
                          <td className="table-actions-cell">
                            {isCancellable && (
                              <>
                                <button 
                                  type="button"
                                  className="btn-table-action warning"
                                  onClick={() => setReschedulingBooking(b)}
                                >
                                  Reprogramar
                                </button>
                                <button 
                                  type="button"
                                  className="btn-table-action danger"
                                  onClick={() => handleCancelBooking(b.bookingId)}
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                      {clientBookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center">Aún no has hecho ninguna reserva.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SEARCH OFFERS (CLIENT ONLY) */}
          {activeTab === 'offers' && user?.role === 'CLIENTE' && (
            <div className="tab-pane">
              <div className="section-header">
                <h2>Oferta Disponible</h2>
                <p>Busca entre los servicios activos de nuestros proveedores y reserva tu cupo.</p>
              </div>

              {/* Search Bar */}
              <div className="search-filter-bar">
                <Search size={20} className="search-icon-input" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por servicio, descripción o proveedor..." 
                  className="search-input"
                />
              </div>

              <div className="offers-grid">
                {filteredOffers.map((offer) => (
                  <div key={offer.serviceId} className="offer-card">
                    <div className="offer-header">
                      <h3>{offer.serviceName}</h3>
                      <span className="provider-name-badge">Por: {offer.providerName}</span>
                    </div>
                    <div className="offer-body">
                      <p>{offer.serviceDescription}</p>
                    </div>
                    <div className="offer-footer">
                      <button 
                        className="btn-reserve" 
                        onClick={() => {
                          setSelectedOffer(offer);
                          // Reset date to today
                          setBookingDate(new Date().toISOString().split('T')[0]);
                        }}
                      >
                        <CalendarDays size={18} />
                        <span>Reservar</span>
                      </button>
                    </div>
                  </div>
                ))}
                {filteredOffers.length === 0 && (
                  <p className="no-data">No se encontraron servicios que coincidan con la búsqueda.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL 1: RESERVE SERVICE (CLIENT ONLY) */}
      {selectedOffer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reservar: {selectedOffer.serviceName}</h3>
              <button className="close-modal-btn" onClick={() => setSelectedOffer(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-muted mb-4">Proveedor: <strong>{selectedOffer.providerName}</strong></p>
              
              <div className="form-group">
                <label>Seleccionar Fecha de Reserva</label>
                <input 
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="modal-date-picker"
                />
              </div>

              <div className="slots-section">
                <h4>Cupos y Horarios Disponibles</h4>
                
                {loadingSlots ? (
                  <div className="loading-spinner">Buscando cupos disponibles...</div>
                ) : (
                  <div className="slots-grid-container">
                    {availableSlots.map((slot) => (
                      <button 
                        key={slot.availabilityId}
                        className="slot-button"
                        disabled={slot.remainingSlots <= 0 || loadingBooking}
                        onClick={() => handleCreateBooking(slot.availabilityId)}
                      >
                        <div className="slot-time">{slot.startTime?.substring(0, 5) || '00:00'} - {slot.endTime?.substring(0, 5) || '00:00'}</div>
                        <div className="slot-remaining">{slot.remainingSlots} cupos libres</div>
                      </button>
                    ))}
                    {availableSlots.length === 0 && (
                      <div className="no-slots-message">
                        <Info size={16} />
                        <span>No hay cupos definidos para esta fecha. Intenta con otro día.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESCHEDULE BOOKING (CLIENT ONLY) */}
      {reschedulingBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reprogramar Reserva #{reschedulingBooking.bookingId}</h3>
              <button className="close-modal-btn" onClick={() => setReschedulingBooking(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-4">
                Servicio: <strong>{reschedulingBooking.serviceName}</strong><br />
                Proveedor: <strong>{reschedulingBooking.providerFullName}</strong>
              </p>
              
              <div className="form-group">
                <label>Nueva Fecha</label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="modal-date-picker"
                />
              </div>

              <div className="slots-section">
                <h4>Nuevos Horarios Disponibles</h4>
                
                {loadingRescheduleSlots ? (
                  <div className="loading-spinner">Buscando cupos...</div>
                ) : (
                  <div className="slots-grid-container">
                    {rescheduleSlots.map((slot) => (
                      <button 
                        key={slot.availabilityId}
                        className="slot-button reschedule"
                        disabled={slot.remainingSlots <= 0}
                        onClick={() => handleRescheduleBooking(slot.availabilityId)}
                      >
                        <div className="slot-time">{slot.startTime?.substring(0, 5) || '00:00'} - {slot.endTime?.substring(0, 5) || '00:00'}</div>
                        <div className="slot-remaining">{slot.remainingSlots} cupos</div>
                      </button>
                    ))}
                    {rescheduleSlots.length === 0 && (
                      <div className="no-slots-message">
                        <Info size={16} />
                        <span>No hay cupos disponibles para esta fecha.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component for a single schedule row to prevent re-renders
interface ScheduleRowProps {
  day: GeneralScheduleDay;
  onSave: (day: string, start: string, end: string) => void;
}

const ScheduleRow: React.FC<ScheduleRowProps> = ({ day, onSave }) => {
  const [start, setStart] = useState(day.horaInicio.substring(0, 5));
  const [end, setEnd] = useState(day.horaFin.substring(0, 5));
  
  const isOff = start === '00:00' && end === '00:00';
  const [active, setActive] = useState(!isOff);

  const handleSaveClick = () => {
    if (!active) {
      onSave(day.dayOfWeek, '00:00:00', '00:00:00');
    } else {
      onSave(day.dayOfWeek, `${start}:00`, `${end}:00`);
    }
  };

  return (
    <div className={`schedule-item-row ${active ? '' : 'inactive'}`}>
      <div className="schedule-day-name">{day.dayOfWeek}</div>
      
      <div className="schedule-inputs">
        <label className="switch-container">
          <input 
            type="checkbox" 
            checked={active} 
            onChange={(e) => {
              setActive(e.target.checked);
              if (!e.target.checked) {
                setStart('00:00');
                setEnd('00:00');
              }
            }} 
          />
          <span className="switch-slider"></span>
        </label>
        
        <span className="switch-label">{active ? 'Atiende' : 'Cerrado'}</span>

        {active && (
          <div className="time-pickers">
            <input 
              type="time" 
              value={start} 
              onChange={(e) => setStart(e.target.value)} 
            />
            <span>a</span>
            <input 
              type="time" 
              value={end} 
              onChange={(e) => setEnd(e.target.value)} 
            />
          </div>
        )}
      </div>

      <button onClick={handleSaveClick} className="btn-save-row">
        Guardar
      </button>
    </div>
  );
};

export default Dashboard;
