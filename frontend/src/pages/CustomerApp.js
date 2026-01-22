import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Coffee,
  ShoppingCart,
  QrCode,
  MapPin,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  Plus,
  Minus,
  User,
  LogOut,
  Crown,
  Tag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QRScanner from '../components/QRScanner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomerApp = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderType, setOrderType] = useState('dine-in');
  const [tableInfo, setTableInfo] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(null);
  const [category, setCategory] = useState('all');
  const [myOrders, setMyOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [discountPreview, setDiscountPreview] = useState(null);
  const [membership, setMembership] = useState(null);
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    const tableQr = searchParams.get('table');
    if (tableQr) {
      verifyTableQR(tableQr);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchMyOrders();
      fetchMembership();
    }
  }, [user]);

  // Fetch discount preview when cart changes and user is logged in
  useEffect(() => {
    if (user && cart.length > 0) {
      fetchDiscountPreview();
    } else {
      setDiscountPreview(null);
    }
  }, [cart, user]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const fetchMembership = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/my/membership`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.length > 0) {
        setMembership(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load membership:', error);
    }
  };

  const fetchDiscountPreview = async () => {
    try {
      const response = await axios.post(`${API_URL}/orders/preview-discount`, {
        customer_id: user.id,
        items: cart,
      });
      setDiscountPreview(response.data);
    } catch (error) {
      console.error('Failed to preview discount:', error);
    }
  };

  const verifyTableQR = async (qrCode) => {
    try {
      const response = await axios.get(`${API_URL}/tables/verify/${qrCode}`);
      setTableInfo(response.data);
      setOrderType('dine-in');
      toast.success(`Table ${response.data.table_number} confirmed!`);
    } catch (error) {
      toast.error('Invalid table QR code');
    }
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.product_id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          price: product.price,
          category: product.category,
        },
      ]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(
      cart
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast.success('Location captured');
        },
        (error) => {
          toast.error('Location access denied');
        }
      );
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (orderType === 'dine-in' && !tableInfo) {
      toast.error('Please scan your table QR code before checkout', {
        description: 'Tap "Scan Table QR" button at the top of the page',
        duration: 5000,
      });
      setShowCart(false);
      return;
    }
    setShowCheckout(true);
  };

  const placeOrder = async () => {
    if (!customerName || !customerEmail) {
      toast.error('Please fill in your details');
      return;
    }

    try {
      const orderData = {
        customer_id: user?.id || null,
        customer_name: customerName,
        customer_email: customerEmail,
        order_type: orderType,
        table_id: tableInfo?.id || null,
        table_number: tableInfo?.table_number || null,
        items: cart,
        total_amount: getTotalAmount(),
        notes: notes,
        customer_location: location,
      };

      const response = await axios.post(`${API_URL}/orders`, orderData);
      toast.success(`Order placed! Order #${response.data.order_number}`);
      
      // Update location for to-go orders
      if (orderType === 'to-go' && location) {
        await axios.put(`${API_URL}/orders/${response.data.id}/location`, location);
      }

      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      if (user) {
        fetchMyOrders();
      }
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  const filteredProducts = category === 'all' 
    ? products 
    : products.filter((p) => p.category === category);

  return (
    <div className="min-h-screen bg-[#F9F7F2]">
      {/* Header */}
      <header className="bg-white border-b border-secondary sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_eatease-19/artifacts/ks9z3yrd_KopiKrasand.png" 
                alt="Kopi Krasand"
                className="logo-kopi"
              />
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOrders(true)}
                    data-testid="my-orders-button"
                  >
                    My Orders
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  data-testid="login-button"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
              <Button
                className="relative rounded-full bg-accent hover:bg-accent/90"
                onClick={() => setShowCart(true)}
                data-testid="cart-button"
              >
                <ShoppingCart className="w-4 h-4" />
                {cart.length > 0 && (
                  <Badge
                    className="absolute -top-2 -right-2 bg-destructive"
                    data-testid="cart-badge"
                  >
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient min-h-[50vh] flex items-center justify-center text-center px-6 relative">
        <div className="absolute inset-0 grain-texture"></div>
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-bold text-white mb-4 tracking-tight">
            Authentic Indonesian Coffee
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8">
            Experience the rich flavors of Kopi Krasand
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => setShowScanner(true)}
              data-testid="scan-table-button"
              className="rounded-full px-8 py-6 bg-white text-primary hover:bg-white/90 font-medium shadow-lg"
            >
              <QrCode className="w-5 h-5 mr-2" />
              Scan Table QR
            </Button>
            <Button
              onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="browse-menu-button"
              className="rounded-full px-8 py-6 bg-accent text-white hover:bg-accent/90 font-medium shadow-lg"
            >
              Browse Menu
            </Button>
          </div>
        </div>
      </section>

      {/* Order Type Selection */}
      <section className="bg-white py-8 border-b border-secondary relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              variant={orderType === 'dine-in' ? 'default' : 'outline'}
              onClick={() => setOrderType('dine-in')}
              data-testid="order-type-dine-in"
              className="rounded-full px-6 py-4 relative z-10"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Dine-In
            </Button>
            <Button
              variant={orderType === 'delivery' ? 'default' : 'outline'}
              onClick={() => setOrderType('delivery')}
              data-testid="order-type-delivery"
              className="rounded-full px-6 py-4 relative z-10"
            >
              <Truck className="w-4 h-4 mr-2" />
              Delivery
            </Button>
            <Button
              variant={orderType === 'to-go' ? 'default' : 'outline'}
              onClick={() => {
                setOrderType('to-go');
                requestLocation();
              }}
              data-testid="order-type-to-go"
              className="rounded-full px-6 py-4 relative z-10"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              To-Go / Pickup
            </Button>
          </div>
          {orderType === 'dine-in' && tableInfo && (
            <div className="text-center mt-4" data-testid="table-info">
              <Badge className="bg-success text-white px-4 py-2">
                Table {tableInfo.table_number}
              </Badge>
            </div>
          )}
          {orderType === 'to-go' && location && (
            <div className="text-center mt-4" data-testid="location-info">
              <Badge className="bg-success text-white px-4 py-2">
                <MapPin className="w-3 h-3 mr-1" />
                Location Shared
              </Badge>
            </div>
          )}
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h3 className="text-3xl sm:text-4xl font-playfair font-bold text-primary mb-8 text-center">
          Our Menu
        </h3>
        
        {/* Category Filter */}
        <div className="flex gap-4 justify-center mb-8 flex-wrap">
          <Button
            variant={category === 'all' ? 'default' : 'outline'}
            onClick={() => setCategory('all')}
            data-testid="category-all"
            className="rounded-full"
          >
            All
          </Button>
          <Button
            variant={category === 'beverage' ? 'default' : 'outline'}
            onClick={() => setCategory('beverage')}
            data-testid="category-beverage"
            className="rounded-full"
          >
            Beverages
          </Button>
          <Button
            variant={category === 'food' ? 'default' : 'outline'}
            onClick={() => setCategory('food')}
            data-testid="category-food"
            className="rounded-full"
          >
            Food
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              data-testid={`product-card-${product.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white border border-secondary hover:border-accent transition-all hover-lift"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/302893/pexels-photo-302893.jpeg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h4 className="font-playfair font-semibold text-xl text-primary mb-2">
                  {product.name}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-accent">
                    ${product.price.toFixed(2)}
                  </span>
                  <Button
                    onClick={() => addToCart(product)}
                    data-testid={`add-to-cart-${product.id}`}
                    className="rounded-full bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md" data-testid="qr-scanner-dialog">
          <DialogHeader>
            <DialogTitle>Scan Table QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at the QR code on your table
            </DialogDescription>
          </DialogHeader>
          <QRScanner
            onScan={(qrCode) => {
              verifyTableQR(qrCode);
              setShowScanner(false);
            }}
            onError={(error) => toast.error(error)}
          />
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="sm:max-w-lg" data-testid="cart-dialog">
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    <div className="flex-1">
                      <h5 className="font-medium">{item.product_name}</h5>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.product_id, -1)}
                        data-testid={`decrease-quantity-${item.product_id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-mono font-medium" data-testid={`quantity-${item.product_id}`}>
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.product_id, 1)}
                        data-testid={`increase-quantity-${item.product_id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold font-mono text-accent" data-testid="cart-total">
                      ${getTotalAmount().toFixed(2)}
                    </span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    data-testid="checkout-button"
                    className="w-full rounded-full bg-accent hover:bg-accent/90 py-6"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-lg" data-testid="checkout-dialog">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                data-testid="customer-name-input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                data-testid="customer-email-input"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Special Instructions</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="order-notes-input"
                placeholder="Any special requests?"
              />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Order Summary:</p>
              <p className="font-medium">Type: {orderType}</p>
              {tableInfo && <p className="font-medium">Table: {tableInfo.table_number}</p>}
              <p className="text-xl font-bold font-mono text-accent mt-2">
                Total: ${getTotalAmount().toFixed(2)}
              </p>
            </div>
            <Button
              onClick={placeOrder}
              data-testid="place-order-button"
              className="w-full rounded-full bg-success hover:bg-success/90 py-6"
            >
              Place Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Orders Dialog */}
      <Dialog open={showOrders} onOpenChange={setShowOrders}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="my-orders-dialog">
          <DialogHeader>
            <DialogTitle>My Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {myOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            ) : (
              myOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-secondary rounded-lg p-4"
                  data-testid={`order-${order.id}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono font-semibold">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        order.status === 'completed'
                          ? 'bg-success'
                          : order.status === 'preparing'
                          ? 'bg-blue-500'
                          : order.status === 'ready'
                          ? 'bg-warning'
                          : 'bg-muted-foreground'
                      }
                      data-testid={`order-status-${order.id}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 mb-2">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm">
                        {item.quantity}x {item.product_name}
                      </p>
                    ))}
                  </div>
                  <p className="font-mono font-bold text-accent">
                    ${order.total_amount.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerApp;
