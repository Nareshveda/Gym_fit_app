import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { IstClock } from './components/layout/IstClock';
import { MemberPortalLayout } from './components/layout/MemberPortalLayout';
import { MemberProtectedRoute, ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminLocationsPage from './pages/AdminLocationsPage';
import AdminPage from './pages/AdminPage';
import AdminStaffCreatePage from './pages/AdminStaffCreatePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AttendancePage from './pages/AttendancePage';
import ContactPage from './pages/ContactPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import InventoryPage from './pages/InventoryPage';
import LoginPage from './pages/LoginPage';
import MemberDetailPage from './pages/MemberDetailPage';
import MemberEditPage from './pages/MemberEditPage';
import MemberEnrollPage from './pages/MemberEnrollPage';
import MemberPortalPage from './pages/MemberPortalPage';
import MembersPage from './pages/MembersPage';
import MemberVitalsPage from './pages/MemberVitalsPage';
import NotFoundPage from './pages/NotFoundPage';
import OverduePaymentsPage from './pages/OverduePaymentsPage';
import PaymentsPage from './pages/PaymentsPage';
import PlansPage from './pages/PlansPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <AuthProvider>
      <IstClock />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={
              <MemberProtectedRoute>
                <MemberPortalLayout />
              </MemberProtectedRoute>
            }
          >
            <Route path="/portal" element={<MemberPortalPage />} />
            {/* Distinct from the staff route below — React Router can't
                disambiguate two identical child paths ("/profile") nested
                under two different pathless guard routes, so a staff user
                clicking their avatar was matching THIS branch, hitting
                MemberProtectedRoute's "not a member" check, and bouncing
                straight back to /dashboard (looked like the click did nothing). */}
            <Route path="/portal/profile" element={<ProfilePage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/new" element={<MemberEnrollPage />} />
            <Route path="/members/:id" element={<MemberDetailPage />} />
            <Route path="/members/:id/edit" element={<MemberEditPage />} />
            <Route path="/members/:id/vitals" element={<MemberVitalsPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/payments/overdue" element={<OverduePaymentsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/staff/new" element={<AdminStaffCreatePage />} />
            <Route path="/admin/locations" element={<AdminLocationsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
