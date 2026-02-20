import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { LogOut, Clock, MapPin, Users, UtensilsCrossed, CalendarCheck } from 'lucide-react';

const WaiterDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        api.get('/orders'),
        api.get('/tables')
      ]);
      setOrders(ordersRes.data.filter((o) => o.status !== 'cancelled'));
      setTables(tablesRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  const updateTableStatus = async (tableId, status) => {
    try {
      await api.put(`/tables/${tableId}/status`, { status });
      toast.success('Table status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update table');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-[#D9A54C]';
      case 'preparing':
        return 'bg-blue-500';
      case 'ready':
        return 'bg-[#4A7A5E]';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-[#4A7A5E]';
      case 'occupied':
        return 'bg-[#D9A54C]';
      case 'reserved':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const readyOrders = orders.filter(o => o.status === 'ready');
  const activeOrders = orders.filter(o => ['pending', 'preparing'].includes(o.status));

  return (
    <div className="min-h-screen bg-[#1A1C1A] text-white">
      <header className="bg-[#5A3A2A] border-b border-[#6b4a3a] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo.png" 
              alt="Kopi Krasand"
              className="h-12"
            />
            <div>
              <h1 className="text-xl font-playfair font-bold text-white">Waiter Station</h1>
              <p className="text-sm text-[#F5EEDC]">{user?.name}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            data-testid="waiter-logout-button"
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6" data-testid="waiter-dashboard">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('orders')}
            data-testid="waiter-orders-tab"
            className={`flex items-center gap-2 ${
              activeTab === 'orders' 
                ? 'bg-[#5A3A2A] text-white' 
                : 'bg-transparent text-[#F5EEDC] hover:bg-[#5A3A2A]/50'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Orders {readyOrders.length > 0 && (
              <Badge className="bg-[#4A7A5E] ml-1">{readyOrders.length} ready</Badge>
            )}
          </Button>
          <Button
            onClick={() => setActiveTab('tables')}
            data-testid="waiter-tables-tab"
            className={`flex items-center gap-2 ${
              activeTab === 'tables' 
                ? 'bg-[#5A3A2A] text-white' 
                : 'bg-transparent text-[#F5EEDC] hover:bg-[#5A3A2A]/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Tables
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#F5EEDC]">Loading...</div>
        ) : activeTab === 'orders' ? (
          <>
            {/* Ready Orders - Priority Section */}
            {readyOrders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#4A7A5E] mb-4 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5" />
                  Ready for Pickup ({readyOrders.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {readyOrders.map((order) => (
                    <Card
                      key={order.id}
                      data-testid={`waiter-ready-order-${order.id}`}
                      className="bg-[#4A7A5E] border-l-4 border-l-white p-4 rounded-lg text-white animate-pulse"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-lg">{order.order_number}</span>
                          <Badge className="bg-white text-[#4A7A5E]">READY</Badge>
                        </div>
                        
                        {order.order_type === 'dine-in' && order.table_number && (
                          <div className="text-lg font-bold bg-white/20 rounded p-2 text-center">
                            Table #{order.table_number}
                          </div>
                        )}

                        {order.order_type === 'to-go' && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>To-Go: {order.customer_name || 'Guest'}</span>
                          </div>
                        )}

                        <div className="text-sm">
                          {order.items.map((item, idx) => (
                            <div key={idx}>{item.quantity}x {item.product_name}</div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Active Orders */}
            <div>
              <h2 className="text-xl font-semibold text-[#F5EEDC] mb-4">
                Active Orders ({activeOrders.length})
              </h2>
              {activeOrders.length === 0 ? (
                <div className="text-center py-12 text-[#F5EEDC]/60">No active orders</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeOrders.map((order) => (
                    <Card
                      key={order.id}
                      data-testid={`waiter-order-${order.id}`}
                      className="bg-[#5A3A2A] p-4 rounded-lg text-white"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold">{order.order_number}</span>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#F5EEDC]">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>

                        {order.order_type === 'dine-in' && order.table_number && (
                          <div className="text-sm text-[#F5EEDC]">
                            Table: <span className="font-semibold">#{order.table_number}</span>
                          </div>
                        )}

                        {order.order_type === 'to-go' && order.customer_location && (
                          <div className="flex items-center gap-2 text-sm text-[#F5EEDC]">
                            <MapPin className="w-4 h-4" />
                            <span>Location Shared</span>
                          </div>
                        )}

                        <div className="border-t border-[#6b4a3a] pt-2 text-sm">
                          {order.items.map((item, idx) => (
                            <div key={idx}>{item.quantity}x {item.product_name}</div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Tables View */
          <div>
            <h2 className="text-xl font-semibold text-[#F5EEDC] mb-4">
              Table Management ({tables.length} tables)
            </h2>
            {tables.length === 0 ? (
              <div className="text-center py-12 text-[#F5EEDC]/60">No tables configured</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <Card
                    key={table.id}
                    data-testid={`waiter-table-${table.id}`}
                    className="bg-[#5A3A2A] p-4 rounded-lg text-white"
                  >
                    <div className="space-y-3 text-center">
                      <div className="text-3xl font-bold text-[#F5EEDC]">
                        #{table.table_number}
                      </div>
                      <Badge className={`${getTableStatusColor(table.status)} w-full justify-center py-1`}>
                        {table.status}
                      </Badge>
                      <div className="text-sm text-[#F5EEDC]/60">
                        Capacity: {table.capacity} seats
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-2">
                        {table.status === 'available' && (
                          <>
                            <Button
                              onClick={() => updateTableStatus(table.id, 'occupied')}
                              data-testid={`table-occupy-${table.id}`}
                              size="sm"
                              className="bg-[#D9A54C] hover:bg-[#c9944c] text-white w-full"
                            >
                              Seat Guests
                            </Button>
                            <Button
                              onClick={() => updateTableStatus(table.id, 'reserved')}
                              data-testid={`table-reserve-${table.id}`}
                              size="sm"
                              variant="outline"
                              className="border-blue-500 text-blue-400 hover:bg-blue-500/10 w-full"
                            >
                              Reserve
                            </Button>
                          </>
                        )}
                        {table.status === 'occupied' && (
                          <Button
                            onClick={() => updateTableStatus(table.id, 'available')}
                            data-testid={`table-clear-${table.id}`}
                            size="sm"
                            className="bg-[#4A7A5E] hover:bg-[#3d6550] text-white w-full"
                          >
                            Clear Table
                          </Button>
                        )}
                        {table.status === 'reserved' && (
                          <>
                            <Button
                              onClick={() => updateTableStatus(table.id, 'occupied')}
                              data-testid={`table-checkin-${table.id}`}
                              size="sm"
                              className="bg-[#D9A54C] hover:bg-[#c9944c] text-white w-full"
                            >
                              Check In
                            </Button>
                            <Button
                              onClick={() => updateTableStatus(table.id, 'available')}
                              data-testid={`table-cancel-${table.id}`}
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-400 hover:bg-red-500/10 w-full"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WaiterDashboard;
