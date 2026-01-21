import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { ChefHat, LogOut, Clock, MapPin } from 'lucide-react';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.filter((o) => o.status !== 'completed' && o.status !== 'cancelled'));
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load orders');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'border-l-warning';
      case 'preparing':
        return 'border-l-blue-500';
      case 'ready':
        return 'border-l-success';
      default:
        return 'border-l-muted';
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1C1A] text-white">
      <header className="bg-[#2C4A3B] border-b border-[#3d5a4a] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-[#F5F1E8]" />
            <div>
              <h1 className="text-2xl font-playfair font-bold text-[#F5F1E8]">Kitchen Display</h1>
              <p className="text-sm text-[#E6DCCA]">{user?.name}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            data-testid="kitchen-logout-button"
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6" data-testid="kitchen-dashboard">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#E6DCCA] mb-2">Active Orders</h2>
          <p className="text-sm text-[#E6DCCA]/60">{orders.length} orders in queue</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#E6DCCA]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-[#E6DCCA]/60">No active orders</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                data-testid={`kitchen-order-${order.id}`}
                className={`bg-[#2C4A3B] border-l-4 ${getStatusColor(
                  order.status
                )} p-4 rounded-lg text-[#F5F1E8]`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-lg">{order.order_number}</span>
                    <Badge
                      className={
                        order.status === 'pending'
                          ? 'bg-[#D9A54C]'
                          : order.status === 'preparing'
                          ? 'bg-blue-500'
                          : 'bg-[#4A7A5E]'
                      }
                      data-testid={`kitchen-order-status-${order.id}`}
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#E6DCCA]">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                  </div>

                  {order.order_type === 'dine-in' && order.table_number && (
                    <div className="text-sm text-[#E6DCCA]">
                      Table: <span className="font-semibold">#{order.table_number}</span>
                    </div>
                  )}

                  {order.order_type === 'to-go' && order.customer_location && (
                    <div className="flex items-center gap-2 text-sm text-[#E6DCCA]">
                      <MapPin className="w-4 h-4" />
                      <span>Location Shared</span>
                    </div>
                  )}

                  <div className="border-t border-[#3d5a4a] pt-3 mt-3">
                    <p className="text-sm text-[#E6DCCA] mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm flex justify-between">
                          <span>
                            {item.quantity}x {item.product_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="bg-[#1A1C1A] p-2 rounded text-sm text-[#E6DCCA]">
                      Note: {order.notes}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {order.status === 'pending' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        data-testid={`start-preparing-${order.id}`}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        data-testid={`mark-ready-${order.id}`}
                        className="flex-1 bg-[#4A7A5E] hover:bg-[#3d6550] text-white"
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <div className="text-center text-sm text-[#4A7A5E] font-semibold w-full py-2">
                        Ready for Pickup
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenDashboard;