import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { CreditCard, LogOut, Search, Printer } from 'lucide-react';

const POSDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
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
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load orders');
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!selectedOrder) return;

    try {
      await api.put(`/orders/${selectedOrder.id}/payment`, { payment_method: paymentMethod });
      toast.success('Payment processed successfully');
      setShowPayment(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error('Payment processing failed');
    }
  };

  const printReceipt = (order) => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${order.order_number}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
            h2 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Kopi Krasand Receipt</h2>
          <p><strong>Order #:</strong> ${order.order_number}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Customer:</strong> ${order.customer_name || 'Guest'}</p>
          <p><strong>Type:</strong> ${order.order_type}</p>
          ${order.table_number ? `<p><strong>Table:</strong> ${order.table_number}</p>` : ''}
          <hr>
          ${order.items.map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.product_name}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="total">
            <div class="item">
              <span>TOTAL:</span>
              <span>$${order.total_amount.toFixed(2)}</span>
            </div>
            <div class="item">
              <span>Payment:</span>
              <span>${order.payment_method || 'Pending'}</span>
            </div>
          </div>
          <p style="text-align: center; margin-top: 20px;">Thank you for your visit!</p>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#1A1C1A] text-white">
      <header className="bg-[#5A3A2A] border-b border-[#6b4a3a] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_eatease-19/artifacts/ks9z3yrd_KopiKrasand.png" 
              alt="Kopi Krasand"
              className="h-12"
            />
            <div>
              <h1 className="text-xl font-playfair font-bold text-white">POS Dashboard</h1>
              <p className="text-sm text-[#F5EEDC]">{user?.name}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            data-testid="pos-logout-button"
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6" data-testid="pos-dashboard">
        <div className="mb-6">
          <div className="flex gap-4 items-center mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#F5EEDC]" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="pos-search-input"
                placeholder="Search by order number or customer name..."
                className="pl-10 bg-[#5A3A2A] border-[#6b4a3a] text-white placeholder:text-[#F5EEDC]/60"
              />
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="bg-[#5A3A2A] px-4 py-2 rounded">
              <span className="text-[#F5EEDC]/60">Total Orders: </span>
              <span className="font-semibold text-white">{orders.length}</span>
            </div>
            <div className="bg-[#5A3A2A] px-4 py-2 rounded">
              <span className="text-[#F5EEDC]/60">Unpaid: </span>
              <span className="font-semibold text-[#D9A54C]">
                {orders.filter((o) => o.payment_status === 'unpaid').length}
              </span>
            </div>
            <div className="bg-[#5A3A2A] px-4 py-2 rounded">
              <span className="text-[#F5EEDC]/60">Paid: </span>
              <span className="font-semibold text-[#4A7A5E]">
                {orders.filter((o) => o.payment_status === 'paid').length}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#F5EEDC]">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-[#F5EEDC]/60">No orders found</div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                data-testid={`pos-order-${order.id}`}
                className="bg-[#5A3A2A] border border-[#6b4a3a] p-4 text-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold text-lg">{order.order_number}</span>
                      <Badge
                        className={
                          order.payment_status === 'paid' ? 'bg-[#4A7A5E]' : 'bg-[#D9A54C]'
                        }
                        data-testid={`pos-payment-status-${order.id}`}
                      >
                        {order.payment_status}
                      </Badge>
                      <Badge
                        className="bg-blue-500"
                        data-testid={`pos-order-status-${order.id}`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[#F5EEDC]">
                      <div>
                        <span className="text-[#F5EEDC]/60">Customer: </span>
                        {order.customer_name || 'Guest'}
                      </div>
                      <div>
                        <span className="text-[#F5EEDC]/60">Type: </span>
                        {order.order_type}
                      </div>
                      {order.table_number && (
                        <div>
                          <span className="text-[#F5EEDC]/60">Table: </span>
                          {order.table_number}
                        </div>
                      )}
                      <div>
                        <span className="text-[#F5EEDC]/60">Items: </span>
                        {order.items.length}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-[#FF7F50]">
                        ${order.total_amount.toFixed(2)}
                      </div>
                      {order.payment_method && (
                        <div className="text-xs text-[#F5EEDC]/60">{order.payment_method}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {order.payment_status === 'unpaid' && order.status === 'ready' && (
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowPayment(true);
                          }}
                          data-testid={`process-payment-${order.id}`}
                          className="bg-[#FF7F50] hover:bg-[#FF7F50]/90 text-white"
                        >
                          Process Payment
                        </Button>
                      )}
                      {order.payment_status === 'paid' && (
                        <Button
                          onClick={() => printReceipt(order)}
                          data-testid={`print-receipt-${order.id}`}
                          variant="outline"
                          className="border-[#F5EEDC]/20 text-[#F5EEDC] hover:bg-white/10"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md bg-[#5A3A2A] text-white" data-testid="payment-dialog">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-[#1A1C1A] p-4 rounded-lg">
                <p className="text-sm text-[#F5EEDC]/60 mb-1">Order Number</p>
                <p className="font-mono font-bold text-lg">{selectedOrder.order_number}</p>
                <p className="text-3xl font-bold font-mono text-[#FF7F50] mt-3">
                  ${selectedOrder.total_amount.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('cash')}
                    data-testid="payment-method-cash"
                    className={paymentMethod === 'cash' ? 'bg-[#FF7F50]' : 'border-[#F5EEDC]/20'}
                  >
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'qr' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('qr')}
                    data-testid="payment-method-qr"
                    className={paymentMethod === 'qr' ? 'bg-[#FF7F50]' : 'border-[#F5EEDC]/20'}
                  >
                    QR Code
                  </Button>
                </div>
              </div>
              <Button
                onClick={processPayment}
                data-testid="confirm-payment-button"
                className="w-full bg-[#4A7A5E] hover:bg-[#3d6550] text-white py-6"
              >
                Confirm Payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSDashboard;