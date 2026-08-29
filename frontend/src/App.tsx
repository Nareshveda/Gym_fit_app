import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AttendancePage from './pages/AttendancePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MemberDetailPage from './pages/MemberDetailPage';
import MemberEditPage from './pages/MemberEditPage';
import MemberEnrollPage from './pages/MemberEnrollPage';
import MembersPage from './pages/MembersPage';
import NotFoundPage from './pages/NotFoundPage';
import OverduePaymentsPage from './pages/OverduePaymentsPage';
import PaymentsPage from './pages/PaymentsPage';
import PlansPage from './pages/PlansPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/payments/overdue" element={<OverduePaymentsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
