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
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QRScanner from '../components/QRScanner';

// In production (Docker), REACT_APP_BACKEND_URL is empty and nginx proxies /api/ to backend
const API_URL = process.env.REACT_APP_BACKEND_URL 
  ? `${process.env.REACT_APP_BACKEND_URL}/api`
  : '/api';

// Error Boundary Component for sections
const SectionErrorFallback = ({ error, onRetry, sectionName }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
    <p className="text-red-600 text-sm mb-2">
      Unable to load {sectionName}
    </p>
    {onRetry && (
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="text-red-600 border-red-300"
      >
        <RefreshCw className="w-4 h-4 mr-1" />
        Retry
      </Button>
    )}
  </div>
);

const CustomerApp = () => {
  // State for data
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [membership, setMembership] = useState(null);
  const [discountPreview, setDiscountPreview] = useState(null);
  
  // State for UI
  const [showCart, setShowCart] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orderType, setOrderType] = useState('dine-in');
  const [tableInfo, setTableInfo] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(null);
  const [category, setCategory] = useState('all');
  
  // State for loading and errors per section
  const [loadingStates, setLoadingStates] = useState({
    products: true,
    orders: false,
    membership: false,
  });
  const [errorStates, setErrorStates] = useState({
    products: null,
    orders: null,
    membership: null,
  });
  
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Initialize app - fetch products on mount
  useEffect(() => {
    fetchProducts();
    const tableQr = searchParams.get('table');
    if (tableQr) {
      verifyTableQR(tableQr);
    }
  }, [searchParams]);

  // Fetch user-specific data when logged in
  useEffect(() => {
    if (user) {
      fetchMyOrders();
      fetchMembership();
      // Pre-fill customer info from user
      setCustomerName(user.name || '');
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  // Fetch discount preview when cart changes
  useEffect(() => {
    if (user && cart.length > 0) {
      fetchDiscountPreview();
    } else {
      setDiscountPreview(null);
    }
  }, [cart, user]);

  // API Functions with error handling per section
  const fetchProducts = async () => {
    setLoadingStates(prev => ({ ...prev, products: true }));
    setErrorStates(prev => ({ ...prev, products: null }));
    
    try {
      const response = await axios.get(`${API_URL}/products`, { timeout: 10000 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setErrorStates(prev => ({ 
        ...prev, 
        products: error.message || 'Failed to load menu' 
      }));
      // Still allow app to function with empty products
      setProducts([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, products: false }));
    }
  };

  const fetchMyOrders = async () => {
    if (!user) return;
    
    setLoadingStates(prev => ({ ...prev, orders: true }));
    setErrorStates(prev => ({ ...prev, orders: null }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setMyOrders(response.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setErrorStates(prev => ({ 
        ...prev, 
        orders: 'Unable to load your orders' 
      }));
      setMyOrders([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, orders: false }));
    }
  };

  const fetchMembership = async () => {
    if (!user) return;
    
    setLoadingStates(prev => ({ ...prev, membership: true }));
    setErrorStates(prev => ({ ...prev, membership: null }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/my/membership`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      if (response.data && response.data.length > 0) {
        setMembership(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load membership:', error);
      // Don't show error for membership - just silently fail
      setMembership(null);
    } finally {
      setLoadingStates(prev => ({ ...prev, membership: false }));
    }
  };

  const fetchDiscountPreview = async () => {
    if (!user || cart.length === 0) return;
    
    try {
      const response = await axios.post(`${API_URL}/orders/preview-discount`, {
        customer_id: user.id,
        items: cart,
      }, { timeout: 5000 });
      setDiscountPreview(response.data);
    } catch (error) {
      console.error('Failed to preview discount:', error);
      // Don't show error - discount preview is optional
      setDiscountPreview(null);
    }
  };

  const verifyTableQR = async (qrCode) => {
    try {
      const response = await axios.get(`${API_URL}/tables/verify/${qrCode}`, { timeout: 5000 });
      setTableInfo(response.data);
      setOrderType('dine-in');
      toast.success(`Table ${response.data.table_number} confirmed!`);
    } catch (error) {
      console.error('Invalid table QR:', error);
      toast.error('Invalid table QR code');
    }
  };

  // Cart Functions
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

  // Checkout Functions
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowCart(false);
    setShowCheckout(true);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success('Location captured!');
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Could not get your location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
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

      const response = await axios.post(`${API_URL}/orders`, orderData, { timeout: 15000 });
      
      // Show discount applied message if applicable
      if (response.data.discount_info && response.data.discount_info.total_discount > 0) {
        toast.success(
          `Order placed! You saved $${response.data.discount_info.total_discount.toFixed(2)} with your ${response.data.discount_info.program_name} membership!`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Order placed! Order #${response.data.order_number}`);
      }
      
      // Update location for to-go orders
      if (orderType === 'to-go' && location) {
        try {
          await axios.put(`${API_URL}/orders/${response.data.id}/location`, location);
        } catch (locError) {
          console.error('Failed to update location:', locError);
          // Don't fail the order for location update failure
        }
      }

      // Reset state
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      setDiscountPreview(null);
      setNotes('');
      
      if (user) {
        fetchMyOrders();
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order. Please try again.');
    }
  };

  // Filter products by category
  const filteredProducts = category === 'all' 
    ? products 
    : products.filter((p) => p.category === category);

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map((p) => p.category))];

  return (
    <div className="min-h-screen bg-[#F5EEDC]">
      {/* Header - Always renders */}
      <header className="sticky top-0 z-40 bg-[#5A3A2A] border-b border-[#6b4a3a] shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Kopi Krasand"
              className="h-10"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-playfair font-bold text-white">Kopi Krasand</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {membership && (
                  <Badge className="bg-[#D9A54C] text-white hidden sm:flex items-center gap-1" data-testid="membership-badge">
                    <Crown className="w-3 h-3" />
                    {membership.program_name}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOrders(true)}
                  data-testid="my-orders-button"
                  className="text-white hover:bg-white/10"
                >
                  My Orders
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  data-testid="logout-button"
                  className="text-white hover:bg-white/10"
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
                className="text-white hover:bg-white/10"
              >
                <User className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
            <Button
              className="relative rounded-full bg-[#D9A54C] hover:bg-[#c9944c]"
              onClick={() => setShowCart(true)}
              data-testid="cart-button"
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 bg-red-500"
                  data-testid="cart-badge"
                >
                  {cart.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Always renders */}
      <section className="relative bg-[#5A3A2A] text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D9A54C] to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-playfair font-bold mb-4">
            Welcome to Kopi Krasand
          </h2>
          <p className="text-lg text-[#F5EEDC]/80 mb-8 max-w-2xl mx-auto">
            Experience the finest coffee crafted with passion. Order ahead for pickup or dine in with us.
          </p>
          
          {/* Order Type Selection */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Button
              onClick={() => setOrderType('dine-in')}
              data-testid="order-type-dine-in"
              className={`rounded-full px-6 ${
                orderType === 'dine-in'
                  ? 'bg-[#D9A54C] text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Dine-in
            </Button>
            <Button
              onClick={() => setOrderType('to-go')}
              data-testid="order-type-to-go"
              className={`rounded-full px-6 ${
                orderType === 'to-go'
                  ? 'bg-[#D9A54C] text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              To-Go
            </Button>
            <Button
              onClick={() => setOrderType('delivery')}
              data-testid="order-type-delivery"
              className={`rounded-full px-6 ${
                orderType === 'delivery'
                  ? 'bg-[#D9A54C] text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Truck className="w-4 h-4 mr-2" />
              Delivery
            </Button>
          </div>

          {/* Table Info or QR Scanner */}
          {orderType === 'dine-in' && (
            <div className="flex justify-center gap-3">
              {tableInfo ? (
                <Badge className="bg-[#4A7A5E] text-white px-4 py-2">
                  Table {tableInfo.table_number}
                </Badge>
              ) : (
                <Button
                  onClick={() => setShowScanner(true)}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan Table QR
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Menu Section */}
      <section className="max-w-7xl mx-auto px-4 py-12" data-testid="menu-section">
        <h3 className="text-2xl font-playfair font-bold text-[#5A3A2A] mb-6">Our Menu</h3>

        {/* Category Filters - Always show if we have products */}
        {products.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <Button
                key={cat}
                onClick={() => setCategory(cat)}
                data-testid={`category-${cat}`}
                className={`rounded-full capitalize ${
                  category === cat
                    ? 'bg-[#5A3A2A] text-white'
                    : 'bg-white text-[#5A3A2A] hover:bg-[#5A3A2A]/10'
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}

        {/* Products Grid with Error Handling */}
        {loadingStates.products ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A3A2A] mx-auto mb-4" />
            <p className="text-[#5A3A2A]">Loading menu...</p>
          </div>
        ) : errorStates.products ? (
          <SectionErrorFallback
            error={errorStates.products}
            sectionName="menu"
            onRetry={fetchProducts}
          />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-[#5A3A2A]/60">
            <Coffee className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-[#E5DDD0] overflow-hidden hover:shadow-md transition-shadow"
                data-testid={`product-card-${product.id}`}
              >
                <div className="h-40 bg-gradient-to-br from-[#5A3A2A] to-[#8B6B5A] flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <Coffee className="w-16 h-16 text-white/30" style={{ display: product.image_url ? 'none' : 'block' }} />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-[#5A3A2A]">{product.name}</h4>
                    <Badge className="bg-[#F5EEDC] text-[#5A3A2A] capitalize">
                      {product.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#5A3A2A]/60 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#D9A54C]">
                      ${product.price?.toFixed(2)}
                    </span>
                    <Button
                      onClick={() => addToCart(product)}
                      data-testid={`add-to-cart-${product.id}`}
                      className="rounded-full bg-[#5A3A2A] hover:bg-[#4a2a1a]"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer - Always renders */}
      <footer className="bg-[#5A3A2A] text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <img
            src="/images/logo.png"
            alt="Kopi Krasand"
            className="h-12 mx-auto mb-4"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <p className="text-[#F5EEDC]/60">
            &copy; {new Date().getFullYear()} Kopi Krasand. All rights reserved.
          </p>
        </div>
      </footer>

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
                
                <div className="border-t pt-4 space-y-3">
                  {/* Discount Preview */}
                  {discountPreview && discountPreview.discount_info && (
                    <div className="bg-[#4A7A5E]/10 border border-[#4A7A5E] rounded-lg p-3" data-testid="discount-preview">
                      <div className="flex items-center gap-2 text-[#4A7A5E] font-semibold mb-2">
                        <Tag className="w-4 h-4" />
                        <span>{discountPreview.discount_info.program_name} Discount Applied!</span>
                      </div>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        {discountPreview.discount_info.food_discount_amount > 0 && (
                          <div className="flex justify-between">
                            <span>Food ({discountPreview.discount_info.food_discount_percent}% off)</span>
                            <span className="text-[#4A7A5E]">-${discountPreview.discount_info.food_discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        {discountPreview.discount_info.beverage_discount_amount > 0 && (
                          <div className="flex justify-between">
                            <span>Beverages ({discountPreview.discount_info.beverage_discount_percent}% off)</span>
                            <span className="text-[#4A7A5E]">-${discountPreview.discount_info.beverage_discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Pricing Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Subtotal:</span>
                      <span className="font-mono">${getTotalAmount().toFixed(2)}</span>
                    </div>
                    
                    {discountPreview && discountPreview.total_discount > 0 && (
                      <div className="flex justify-between items-center text-[#4A7A5E]">
                        <span>Discount:</span>
                        <span className="font-mono font-semibold" data-testid="discount-amount">
                          -${discountPreview.total_discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold font-mono text-[#D9A54C]" data-testid="cart-total">
                        ${(discountPreview ? discountPreview.final_amount : getTotalAmount()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Login prompt for non-members */}
                  {!user && (
                    <div className="bg-[#D9A54C]/10 border border-[#D9A54C] rounded-lg p-3 text-center">
                      <p className="text-sm text-[#5A3A2A]">
                        <Crown className="w-4 h-4 inline mr-1" />
                        <span className="font-semibold">Login to get member discounts!</span>
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleCheckout}
                    data-testid="checkout-button"
                    className="w-full rounded-full bg-[#D9A54C] hover:bg-[#c9944c] py-6"
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
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete your order details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Your Name</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                data-testid="checkout-name-input"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                data-testid="checkout-email-input"
                placeholder="john@example.com"
              />
            </div>
            
            {orderType === 'to-go' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Share Location (optional)</label>
                <Button
                  onClick={getLocation}
                  variant="outline"
                  className="w-full"
                  data-testid="share-location-button"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {location ? 'Location Captured' : 'Share My Location'}
                </Button>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Special Instructions</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="checkout-notes-input"
                placeholder="Any special requests..."
              />
            </div>

            {/* Order Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground mb-2">Order Summary:</p>
              <p className="font-medium">Type: {orderType}</p>
              {tableInfo && <p className="font-medium">Table: {tableInfo.table_number}</p>}
              
              {/* Discount info in checkout */}
              {discountPreview && discountPreview.discount_info && (
                <div className="bg-[#4A7A5E]/10 rounded p-2 my-2">
                  <p className="text-sm text-[#4A7A5E] font-semibold flex items-center gap-1">
                    <Crown className="w-4 h-4" />
                    {discountPreview.discount_info.program_name} Member
                  </p>
                  <p className="text-sm text-[#4A7A5E]">
                    You save: ${discountPreview.total_discount.toFixed(2)}
                  </p>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-mono">${getTotalAmount().toFixed(2)}</span>
                </div>
                {discountPreview && discountPreview.total_discount > 0 && (
                  <div className="flex justify-between text-sm text-[#4A7A5E]">
                    <span>Discount:</span>
                    <span className="font-mono">-${discountPreview.total_discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold font-mono text-[#D9A54C]">
                    ${(discountPreview ? discountPreview.final_amount : getTotalAmount()).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={placeOrder}
              data-testid="place-order-button"
              className="w-full rounded-full bg-[#4A7A5E] hover:bg-[#3d6550] py-6"
            >
              Place Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Table QR Code</DialogTitle>
          </DialogHeader>
          <QRScanner
            onScan={(data) => {
              verifyTableQR(data);
              setShowScanner(false);
            }}
            onError={(error) => {
              console.error('QR scan error:', error);
              toast.error('Failed to scan QR code');
            }}
          />
        </DialogContent>
      </Dialog>

      {/* My Orders Dialog */}
      <Dialog open={showOrders} onOpenChange={setShowOrders}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" data-testid="orders-dialog">
          <DialogHeader>
            <DialogTitle>My Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loadingStates.orders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A3A2A] mx-auto" />
              </div>
            ) : errorStates.orders ? (
              <SectionErrorFallback
                error={errorStates.orders}
                sectionName="orders"
                onRetry={fetchMyOrders}
              />
            ) : myOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            ) : (
              myOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="p-4 border rounded-lg"
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
                          ? 'bg-[#4A7A5E]'
                          : order.status === 'ready'
                          ? 'bg-blue-500'
                          : order.status === 'preparing'
                          ? 'bg-orange-500'
                          : 'bg-[#D9A54C]'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.items?.map((item, idx) => (
                      <p key={idx}>
                        {item.quantity}x {item.product_name}
                      </p>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">{order.order_type}</span>
                    <span className="font-bold text-[#D9A54C]">
                      ${order.total_amount?.toFixed(2)}
                    </span>
                  </div>
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
