import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import CustomerApp from './pages/CustomerApp';
import KitchenDashboard from './pages/KitchenDashboard';
import POSDashboard from './pages/POSDashboard';
import InventoryDashboard from './pages/InventoryDashboard';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

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
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<CustomerApp />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/kitchen"
              element={
                <PrivateRoute allowedRoles={['kitchen']}>
                  <KitchenDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <PrivateRoute allowedRoles={['cashier']}>
                  <POSDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <PrivateRoute allowedRoles={['inventory_manager']}>
                  <InventoryDashboard />
                </PrivateRoute>
              }
            />
          </Routes>
          <Toaster position="top-center" richColors />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;