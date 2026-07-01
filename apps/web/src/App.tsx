import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CalendarPage from '@/pages/CalendarPage';
import NewAppointmentPage from '@/pages/NewAppointmentPage';
import AppointmentDetailPage from '@/pages/AppointmentDetailPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import MastersPage from '@/pages/MastersPage';
import ServicesPage from '@/pages/ServicesPage';
import SettingsPage from '@/pages/SettingsPage';

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/appointments/new" element={<NewAppointmentPage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* OWNER only */}
          <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
            <Route path="/masters" element={<MastersPage />} />
            <Route path="/services" element={<ServicesPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}
