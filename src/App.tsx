import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Preloader from './components/Preloader';
import Header from './components/Header';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AnimatePresence } from 'motion/react';

const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

const Home = React.lazy(() => import('./pages/Home'));
const Medicines = React.lazy(() => import('./pages/Medicines'));
const MedicineDetails = React.lazy(() => import('./pages/MedicineDetails'));
const SavedMedicines = React.lazy(() => import('./pages/SavedMedicines'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const AddressManagement = React.lazy(() => import('./pages/AddressManagement'));

const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/Users'));
const AdminPharmacies = React.lazy(() => import('./pages/admin/Pharmacies'));
const AdminCategories = React.lazy(() => import('./pages/admin/Categories'));
const AdminReports = React.lazy(() => import('./pages/admin/Reports'));

const PharmacistDashboard = React.lazy(() => import('./pages/pharmacist/Dashboard'));
const PharmacistInventory = React.lazy(() => import('./pages/pharmacist/Inventory'));
const PharmacistMedicineForm = React.lazy(() => import('./pages/pharmacist/MedicineForm'));

// Debug page (development only)
const Debug = React.lazy(() => import('./pages/Debug'));

const RouteLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <Preloader />
  </div>
);

const PageSuspense = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<RouteLoader />}>{children}</Suspense>;

const AdminLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-grow">
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="dashboard" element={<PageSuspense><AdminDashboard /></PageSuspense>} />
          <Route path="users" element={<PageSuspense><AdminUsers /></PageSuspense>} />
          <Route path="pharmacies" element={<PageSuspense><AdminPharmacies /></PageSuspense>} />
          <Route path="categories" element={<PageSuspense><AdminCategories /></PageSuspense>} />
          <Route path="reports" element={<PageSuspense><AdminReports /></PageSuspense>} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    </main>
  </div>
);

const PharmacistLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-grow">
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={['pharmacist']} />}>
          <Route path="dashboard" element={<PageSuspense><PharmacistDashboard /></PageSuspense>} />
          <Route path="inventory" element={<PageSuspense><PharmacistInventory /></PageSuspense>} />
          <Route path="medicine/new" element={<PageSuspense><PharmacistMedicineForm /></PageSuspense>} />
          <Route path="medicine/:medicineId" element={<PageSuspense><PharmacistMedicineForm /></PageSuspense>} />
          <Route path="orders" element={<PageSuspense><Orders /></PageSuspense>} />
          <Route path="*" element={<Navigate to="/pharmacist/dashboard" replace />} />
        </Route>
      </Routes>
    </main>
  </div>
);

const CustomerLayout = () => (
  <Layout>
    <Routes>
      <Route index element={<PageSuspense><Home /></PageSuspense>} />
      <Route path="medicines" element={<PageSuspense><Medicines /></PageSuspense>} />
      <Route path="medicines/:medicineId" element={<PageSuspense><MedicineDetails /></PageSuspense>} />

      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route path="saved-medicines" element={<PageSuspense><SavedMedicines /></PageSuspense>} />
        <Route path="cart" element={<PageSuspense><Cart /></PageSuspense>} />
        <Route path="chat" element={<PageSuspense><Chat /></PageSuspense>} />
        <Route path="orders" element={<PageSuspense><Orders /></PageSuspense>} />
        <Route path="notifications" element={<PageSuspense><Notifications /></PageSuspense>} />
        <Route path="addresses" element={<PageSuspense><AddressManagement /></PageSuspense>} />
        <Route path="profile" element={<PageSuspense><Profile /></PageSuspense>} />
        {/* Debug route - accessible to all authenticated users for troubleshooting */}
        <Route path="debug" element={<PageSuspense><Debug /></PageSuspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

function AppContent() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Preloader />;

  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<PageSuspense><Login /></PageSuspense>} />
              <Route path="/register" element={<PageSuspense><Register /></PageSuspense>} />
              <Route path="/forgot-password" element={<PageSuspense><ForgotPassword /></PageSuspense>} />
              <Route path="/reset-password" element={<PageSuspense><ResetPassword /></PageSuspense>} />
              <Route path="/admin/*" element={<AdminLayout />} />
              <Route path="/pharmacist/*" element={<PharmacistLayout />} />
              <Route path="/*" element={<CustomerLayout />} />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
