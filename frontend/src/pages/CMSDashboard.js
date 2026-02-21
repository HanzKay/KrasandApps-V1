import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { 
  LogOut, Package, Coffee, Grid, Plus, Trash2, Edit, 
  Image, DollarSign, Tag, Save, Upload, Eye, EyeOff,
  GripVertical, ChevronUp, ChevronDown, Globe
} from 'lucide-react';

const CMSDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [settings, setSettings] = useState({ currency_symbol: 'Rp', currency_code: 'IDR' });
  const [savingSettings, setSavingSettings] = useState(false);
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef(null);

  const currencyOptions = [
    { symbol: '$', code: 'USD', name: 'US Dollar' },
    { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah' },
    { symbol: '€', code: 'EUR', name: 'Euro' },
    { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
    { symbol: '£', code: 'GBP', name: 'British Pound' },
    { symbol: '₩', code: 'KRW', name: 'Korean Won' },
    { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit' },
    { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' },
  ];

  const languageOptions = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  const defaultProductForm = {
    name: '',
    description: '',
    price: 0,
    category: 'beverage',
    image_url: '',
    available: true,
    featured: false,
    sort_order: 0,
    recipes: []
  };

  const [productForm, setProductForm] = useState(defaultProductForm);

  const defaultCategoryForm = {
    name: '',
    slug: '',
    description: '',
    icon: 'Coffee',
    sort_order: 0,
    active: true
  };

  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, ingredientsRes, categoriesRes, settingsRes] = await Promise.all([
        api.get('/products?include_unavailable=true'),
        api.get('/ingredients').catch(() => ({ data: [] })),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/settings').catch(() => ({ data: { currency_symbol: 'Rp', currency_code: 'IDR' } }))
      ]);
      
      setProducts(productsRes.data || []);
      setIngredients(ingredientsRes.data || []);
      setCategories(categoriesRes.data || [
        { id: 'beverage', name: 'Beverages', slug: 'beverage', sort_order: 1 },
        { id: 'food', name: 'Food', slug: 'food', sort_order: 2 }
      ]);
      setSettings(settingsRes.data || { currency_symbol: 'Rp', currency_code: 'IDR' });
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/settings', settings);
      toast.success('Currency settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCurrencyChange = (code) => {
    const selected = currencyOptions.find(c => c.code === code);
    if (selected) {
      setSettings({ currency_symbol: selected.symbol, currency_code: selected.code });
    }
  };

  // Product Functions
  const openProductDialog = (product = null) => {
    if (product) {
      setProductForm({
        ...product,
        recipes: product.recipes || []
      });
      setEditingProduct(product);
    } else {
      setProductForm(defaultProductForm);
      setEditingProduct(null);
    }
    setShowProductDialog(true);
  };

  const saveProduct = async () => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productForm);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', productForm);
        toast.success('Product created successfully');
      }
      setShowProductDialog(false);
      setProductForm(defaultProductForm);
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save product');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const toggleProductAvailability = async (product) => {
    try {
      await api.put(`/products/${product.id}`, {
        ...product,
        available: !product.available
      });
      toast.success(`Product ${!product.available ? 'enabled' : 'disabled'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const moveProduct = async (product, direction) => {
    const currentIndex = products.findIndex(p => p.id === product.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= products.length) return;
    
    const newProducts = [...products];
    [newProducts[currentIndex], newProducts[newIndex]] = [newProducts[newIndex], newProducts[currentIndex]];
    
    // Update sort orders
    for (let i = 0; i < newProducts.length; i++) {
      try {
        await api.put(`/products/${newProducts[i].id}`, {
          ...newProducts[i],
          sort_order: i
        });
      } catch (error) {
        console.error('Failed to update sort order');
      }
    }
    
    fetchData();
  };

  // Category Functions
  const openCategoryDialog = (category = null) => {
    if (category) {
      setCategoryForm(category);
      setEditingCategory(category);
    } else {
      setCategoryForm(defaultCategoryForm);
      setEditingCategory(null);
    }
    setShowCategoryDialog(true);
  };

  const saveCategory = async () => {
    try {
      const slug = categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-');
      const data = { ...categoryForm, slug };
      
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, data);
        toast.success('Category updated');
      } else {
        await api.post('/categories', data);
        toast.success('Category created');
      }
      setShowCategoryDialog(false);
      setCategoryForm(defaultCategoryForm);
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success('Category deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  // Image handling
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For now, store as base64 - in production use cloud storage
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm({ ...productForm, image_url: reader.result });
      toast.success('Image uploaded');
    };
    reader.readAsDataURL(file);
  };

  // Recipe management
  const addRecipeIngredient = () => {
    setProductForm({
      ...productForm,
      recipes: [...productForm.recipes, { ingredient_id: '', quantity: 0 }]
    });
  };

  const updateRecipe = (index, field, value) => {
    const newRecipes = [...productForm.recipes];
    newRecipes[index][field] = value;
    setProductForm({ ...productForm, recipes: newRecipes });
  };

  const removeRecipe = (index) => {
    setProductForm({
      ...productForm,
      recipes: productForm.recipes.filter((_, i) => i !== index)
    });
  };

  const groupedProducts = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category === cat.slug || p.category === cat.id)
  }));

  return (
    <div className="min-h-screen bg-[#1A1C1A] text-white">
      <header className="bg-[#5A3A2A] border-b border-[#6b4a3a] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Kopi Krasand" className="h-12" />
            <div>
              <h1 className="text-xl font-playfair font-bold text-white">Content Management</h1>
              <p className="text-sm text-[#F5EEDC]">{user?.name}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            data-testid="cms-logout-button"
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6" data-testid="cms-dashboard">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#5A3A2A] p-4 text-white">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-[#D9A54C]" />
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-[#F5EEDC]/70">Products</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#5A3A2A] p-4 text-white">
            <div className="flex items-center gap-3">
              <Grid className="w-8 h-8 text-[#D9A54C]" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-[#F5EEDC]/70">Categories</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#5A3A2A] p-4 text-white">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-[#4A7A5E]" />
              <div>
                <p className="text-2xl font-bold">{products.filter(p => p.available).length}</p>
                <p className="text-sm text-[#F5EEDC]/70">Active</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#5A3A2A] p-4 text-white">
            <div className="flex items-center gap-3">
              <EyeOff className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold">{products.filter(p => !p.available).length}</p>
                <p className="text-sm text-[#F5EEDC]/70">Hidden</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-[#5A3A2A] border border-[#6b4a3a]">
            <TabsTrigger value="products" data-testid="cms-products-tab" className="data-[state=active]:bg-[#D9A54C]">
              <Coffee className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="cms-categories-tab" className="data-[state=active]:bg-[#D9A54C]">
              <Grid className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="cms-settings-tab" className="data-[state=active]:bg-[#D9A54C]">
              <DollarSign className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#F5EEDC]">Menu Products</h2>
              <Button
                onClick={() => openProductDialog()}
                data-testid="cms-add-product-button"
                className="bg-[#D9A54C] hover:bg-[#c9944c] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-[#F5EEDC]">Loading...</div>
            ) : (
              groupedProducts.map(category => (
                <div key={category.id} className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#D9A54C] flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    {category.name} ({category.products.length})
                  </h3>
                  
                  {category.products.length === 0 ? (
                    <p className="text-[#F5EEDC]/50 text-sm pl-7">No products in this category</p>
                  ) : (
                    <div className="grid gap-3">
                      {category.products.map((product, index) => (
                        <Card
                          key={product.id}
                          data-testid={`cms-product-${product.id}`}
                          className={`bg-[#5A3A2A] p-4 text-white ${!product.available ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Sort Controls */}
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveProduct(product, 'up')}
                                className="h-6 w-6 p-0 text-[#F5EEDC]/50 hover:text-white"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveProduct(product, 'down')}
                                className="h-6 w-6 p-0 text-[#F5EEDC]/50 hover:text-white"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Product Image */}
                            <div className="w-16 h-16 rounded-lg bg-[#1A1C1A] flex items-center justify-center overflow-hidden">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Coffee className="w-8 h-8 text-[#D9A54C]" />
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{product.name}</h4>
                                {product.featured && <Badge className="bg-[#D9A54C]">Featured</Badge>}
                                {!product.available && <Badge className="bg-red-500">Hidden</Badge>}
                              </div>
                              <p className="text-sm text-[#F5EEDC]/70 line-clamp-1">{product.description}</p>
                              <p className="text-[#D9A54C] font-mono font-bold">${product.price?.toFixed(2)}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={product.available}
                                onCheckedChange={() => toggleProductAvailability(product)}
                                data-testid={`toggle-product-${product.id}`}
                              />
                              <Button
                                onClick={() => openProductDialog(product)}
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => deleteProduct(product.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#F5EEDC]">Menu Categories</h2>
              <Button
                onClick={() => openCategoryDialog()}
                data-testid="cms-add-category-button"
                className="bg-[#D9A54C] hover:bg-[#c9944c] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {categories.map(category => (
                <Card key={category.id} className="bg-[#5A3A2A] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{category.name}</h4>
                      <p className="text-sm text-[#F5EEDC]/70">Slug: {category.slug}</p>
                      <p className="text-sm text-[#F5EEDC]/70">
                        {products.filter(p => p.category === category.slug || p.category === category.id).length} products
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openCategoryDialog(category)}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteCategory(category.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Currency Settings */}
            <Card className="bg-[#5A3A2A] p-6">
              <h3 className="text-lg font-semibold text-[#F5EEDC] mb-4">{t('currencySettings')}</h3>
              <p className="text-[#F5EEDC]/70 text-sm mb-6">
                {language === 'id' 
                  ? 'Pilih mata uang untuk menampilkan harga di seluruh aplikasi.' 
                  : 'Select the currency to display prices throughout the application.'}
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {currencyOptions.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      settings.currency_code === currency.code
                        ? 'border-[#D9A54C] bg-[#D9A54C]/20'
                        : 'border-[#6b4a3a] hover:border-[#D9A54C]/50'
                    }`}
                  >
                    <div className="text-2xl font-bold text-[#F5EEDC]">{currency.symbol}</div>
                    <div className="text-xs text-[#F5EEDC]/70 mt-1">{currency.code}</div>
                    <div className="text-xs text-[#F5EEDC]/50">{currency.name}</div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#1A1C1A] rounded-lg mb-6">
                <DollarSign className="w-8 h-8 text-[#D9A54C]" />
                <div>
                  <p className="text-[#F5EEDC]/70 text-sm">{language === 'id' ? 'Pengaturan Saat Ini' : 'Current Setting'}</p>
                  <p className="text-[#F5EEDC] text-lg font-semibold">
                    {settings.currency_symbol} ({settings.currency_code})
                  </p>
                </div>
              </div>

              <Button 
                onClick={saveSettings}
                disabled={savingSettings}
                className="bg-[#D9A54C] hover:bg-[#c99540] text-[#1A1C1A]"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingSettings ? t('loading') : t('save')}
              </Button>
            </Card>

            {/* Language Settings */}
            <Card className="bg-[#5A3A2A] p-6">
              <h3 className="text-lg font-semibold text-[#F5EEDC] mb-4">{t('languageSettings')}</h3>
              <p className="text-[#F5EEDC]/70 text-sm mb-6">
                {language === 'id' 
                  ? 'Pilih bahasa default untuk aplikasi.' 
                  : 'Select the default language for the application.'}
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      language === lang.code
                        ? 'border-[#D9A54C] bg-[#D9A54C]/20'
                        : 'border-[#6b4a3a] hover:border-[#D9A54C]/50'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left">
                      <div className="text-lg font-bold text-[#F5EEDC]">{lang.code.toUpperCase()}</div>
                      <div className="text-xs text-[#F5EEDC]/70">{lang.name}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#1A1C1A] rounded-lg">
                <Globe className="w-8 h-8 text-[#D9A54C]" />
                <div>
                  <p className="text-[#F5EEDC]/70 text-sm">{language === 'id' ? 'Bahasa Aktif' : 'Active Language'}</p>
                  <p className="text-[#F5EEDC] text-lg font-semibold">
                    {languageOptions.find(l => l.code === language)?.name || 'Bahasa Indonesia'}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Product Dialog */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="bg-[#5A3A2A] text-white border-[#6b4a3a] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Espresso"
                    className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                  />
                </div>
                <div>
                  <Label>Price ({settings.currency_symbol})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Rich, bold espresso shot..."
                  className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-[#1A1C1A] border border-[#6b4a3a] rounded-md text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug || cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={productForm.sort_order}
                    onChange={(e) => setProductForm({ ...productForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Product Image</Label>
                <div className="flex gap-4 items-center mt-2">
                  <div className="w-24 h-24 rounded-lg bg-[#1A1C1A] flex items-center justify-center overflow-hidden border border-[#6b4a3a]">
                    {productForm.image_url ? (
                      <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 text-[#F5EEDC]/30" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="border-[#D9A54C] text-[#D9A54C]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <p className="text-xs text-[#F5EEDC]/50 mt-1">Or paste image URL below</p>
                    <Input
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      placeholder="https://..."
                      className="bg-[#1A1C1A] border-[#6b4a3a] text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={productForm.available}
                    onCheckedChange={(checked) => setProductForm({ ...productForm, available: checked })}
                  />
                  <span>Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={productForm.featured}
                    onCheckedChange={(checked) => setProductForm({ ...productForm, featured: checked })}
                  />
                  <span>Featured</span>
                </label>
              </div>

              {/* Recipe Ingredients */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Recipe Ingredients</Label>
                  <Button onClick={addRecipeIngredient} size="sm" variant="outline" className="border-[#D9A54C] text-[#D9A54C]">
                    <Plus className="w-4 h-4 mr-1" /> Add Ingredient
                  </Button>
                </div>
                {productForm.recipes.length === 0 ? (
                  <p className="text-sm text-[#F5EEDC]/50">No ingredients added (optional)</p>
                ) : (
                  <div className="space-y-2">
                    {productForm.recipes.map((recipe, index) => (
                      <div key={index} className="flex gap-2 items-center bg-[#1A1C1A] p-2 rounded">
                        <select
                          value={recipe.ingredient_id}
                          onChange={(e) => updateRecipe(index, 'ingredient_id', e.target.value)}
                          className="flex-1 px-2 py-1 bg-[#5A3A2A] border border-[#6b4a3a] rounded text-white text-sm"
                        >
                          <option value="">Select ingredient</option>
                          {ingredients.map(ing => (
                            <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          step="0.1"
                          value={recipe.quantity}
                          onChange={(e) => updateRecipe(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Qty"
                          className="w-20 bg-[#5A3A2A] border-[#6b4a3a] text-white"
                        />
                        <Button onClick={() => removeRecipe(index)} size="sm" variant="ghost" className="text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={saveProduct} className="w-full bg-[#D9A54C] hover:bg-[#c9944c]">
                <Save className="w-4 h-4 mr-2" />
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="bg-[#5A3A2A] text-white border-[#6b4a3a]">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category Name</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Beverages"
                  className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                />
              </div>
              <div>
                <Label>Slug (URL-friendly name)</Label>
                <Input
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="beverages"
                  className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Hot and cold beverages..."
                  className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                  rows={2}
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                />
              </div>
              <Button onClick={saveCategory} className="w-full bg-[#D9A54C] hover:bg-[#c9944c]">
                <Save className="w-4 h-4 mr-2" />
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default CMSDashboard;
