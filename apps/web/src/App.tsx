import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const NewAppointmentPage = lazy(() => import('@/pages/NewAppointmentPage'));
const AppointmentDetailPage = lazy(() => import('@/pages/AppointmentDetailPage'));
const ClientsPage = lazy(() => import('@/pages/ClientsPage'));
const ClientDetailPage = lazy(() => import('@/pages/ClientDetailPage'));
const MastersPage = lazy(() => import('@/pages/MastersPage'));
const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </>
  );
}
