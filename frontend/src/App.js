import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import CustomerApp from './pages/CustomerApp';
import KitchenDashboard from './pages/KitchenDashboard';
import POSDashboard from './pages/POSDashboard';
import InventoryDashboard from './pages/InventoryDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CMSDashboard from './pages/CMSDashboard';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2]">
        <div className="text-lg font-medium text-primary">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <Routes>
            {/* Customer App - Public Access */}
            <Route path="/" element={<CustomerApp />} />
            <Route path="/login" element={<Login />} />
            
            {/* Admin Dashboard - Admin Only */}
            <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            
            {/* CMS Dashboard - Admin Only */}
            <Route
              path="/cms"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <CMSDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Kitchen Dashboard - Kitchen Staff Only */}
            <Route
              path="/kitchen"
              element={
                <PrivateRoute allowedRoles={['kitchen']}>
                  <KitchenDashboard />
                </PrivateRoute>
              }
            />
            
            {/* POS Dashboard - Cashier Only */}
            <Route
              path="/pos"
              element={
                <PrivateRoute allowedRoles={['cashier']}>
                  <POSDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Waiter Dashboard - Waiter Only */}
            <Route
              path="/waiter"
              element={
                <PrivateRoute allowedRoles={['waiter']}>
                  <WaiterDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Inventory/Storage Dashboard - Storage Staff Only */}
            <Route
              path="/storage"
              element={
                <PrivateRoute allowedRoles={['storage']}>
                  <InventoryDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Legacy route redirect */}
            <Route path="/inventory" element={<Navigate to="/storage" replace />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </div>
      </BrowserRouter>
    </AuthProvider>
  </LanguageProvider>
  );
}

export default App;