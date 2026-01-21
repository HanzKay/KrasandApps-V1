import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Package, LogOut, Plus, AlertTriangle, Utensils, DollarSign, QrCode } from 'lucide-react';

const InventoryDashboard = () => {
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [cogs, setCogs] = useState([]);
  const [tables, setTables] = useState([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCOGS, setShowAddCOGS] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const { user, logout } = useAuth();

  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    unit: '',
    current_stock: 0,
    min_stock: 0,
    cost_per_unit: 0,
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'beverage',
    price: 0,
    image_url: '',
    recipes: [],
  });

  const [cogsForm, setCogsForm] = useState({
    name: '',
    description: '',
    cost: 0,
    category: '',
  });

  const [tableForm, setTableForm] = useState({
    table_number: 1,
    capacity: 4,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ingredientsRes, productsRes, cogsRes, tablesRes] = await Promise.all([
        api.get('/ingredients'),
        api.get('/products'),
        api.get('/cogs'),
        api.get('/tables'),
      ]);
      setIngredients(ingredientsRes.data);
      setProducts(productsRes.data);
      setCogs(cogsRes.data);
      setTables(tablesRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const addIngredient = async () => {
    try {
      await api.post('/ingredients', ingredientForm);
      toast.success('Ingredient added');
      setShowAddIngredient(false);
      setIngredientForm({ name: '', unit: '', current_stock: 0, min_stock: 0, cost_per_unit: 0 });
      fetchData();
    } catch (error) {
      toast.error('Failed to add ingredient');
    }
  };

  const addProduct = async () => {
    try {
      await api.post('/products', productForm);
      toast.success('Product added');
      setShowAddProduct(false);
      setProductForm({ name: '', description: '', category: 'beverage', price: 0, image_url: '', recipes: [] });
      fetchData();
    } catch (error) {
      toast.error('Failed to add product');
    }
  };

  const addCOGS = async () => {
    try {
      await api.post('/cogs', cogsForm);
      toast.success('COGS entry added');
      setShowAddCOGS(false);
      setCogsForm({ name: '', description: '', cost: 0, category: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add COGS');
    }
  };

  const addTable = async () => {
    try {
      await api.post('/tables', tableForm);
      toast.success('Table added with QR code');
      setShowAddTable(false);
      setTableForm({ table_number: 1, capacity: 4 });
      fetchData();
    } catch (error) {
      toast.error('Failed to add table');
    }
  };

  const downloadQRCode = (table) => {
    const link = document.createElement('a');
    link.href = table.qr_image;
    link.download = `table-${table.table_number}-qr.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#F5EEDC]">
      <header className="bg-white border-b border-secondary p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-playfair font-bold text-primary">Inventory Management</h1>
              <p className="text-sm text-muted-foreground">{user?.name}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            data-testid="inventory-logout-button"
            variant="outline"
            className="border-primary/20 text-primary hover:bg-primary/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6" data-testid="inventory-dashboard">
        <Tabs defaultValue="ingredients" className="space-y-6">
          <TabsList className="bg-white border border-secondary">
            <TabsTrigger value="ingredients" data-testid="tab-ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="cogs" data-testid="tab-cogs">COGS</TabsTrigger>
            <TabsTrigger value="tables" data-testid="tab-tables">Tables</TabsTrigger>
          </TabsList>

          {/* Ingredients Tab */}
          <TabsContent value="ingredients" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Ingredients Stock</h2>
              <Button
                onClick={() => setShowAddIngredient(true)}
                data-testid="add-ingredient-button"
                className="bg-primary hover:bg-primary/90 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </Button>
            </div>
            <div className="grid gap-4">
              {ingredients.map((ingredient) => (
                <Card
                  key={ingredient.id}
                  data-testid={`ingredient-${ingredient.id}`}
                  className="bg-white border-secondary p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary">{ingredient.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>Unit: {ingredient.unit}</span>
                        <span>Cost: ${ingredient.cost_per_unit.toFixed(2)}/{ingredient.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {ingredient.current_stock <= ingredient.min_stock && (
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        )}
                        <span
                          className={`text-2xl font-bold font-mono ${
                            ingredient.current_stock <= ingredient.min_stock
                              ? 'text-destructive'
                              : 'text-success'
                          }`}
                          data-testid={`stock-${ingredient.id}`}
                        >
                          {ingredient.current_stock}
                        </span>
                        <span className="text-muted-foreground">{ingredient.unit}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Min: {ingredient.min_stock} {ingredient.unit}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Menu Products</h2>
              <Button
                onClick={() => setShowAddProduct(true)}
                data-testid="add-product-button"
                className="bg-primary hover:bg-primary/90 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  data-testid={`product-${product.id}`}
                  className="bg-white border-secondary overflow-hidden"
                >
                  {product.image_url && (
                    <div className="aspect-video bg-muted">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-primary">{product.name}</h3>
                      <Badge className={product.category === 'beverage' ? 'bg-blue-500' : 'bg-accent'}>
                        {product.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold font-mono text-accent">
                        ${product.price.toFixed(2)}
                      </span>
                      <Badge className={product.available ? 'bg-success' : 'bg-muted'}>
                        {product.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* COGS Tab */}
          <TabsContent value="cogs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Cost of Goods Sold (COGS)</h2>
              <Button
                onClick={() => setShowAddCOGS(true)}
                data-testid="add-cogs-button"
                className="bg-primary hover:bg-primary/90 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add COGS Entry
              </Button>
            </div>
            <div className="grid gap-4">
              {cogs.map((item) => (
                <Card
                  key={item.id}
                  data-testid={`cogs-${item.id}`}
                  className="bg-white border-secondary p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <Badge className="mt-2 bg-muted text-muted-foreground">{item.category}</Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-accent">
                        ${item.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Table Management</h2>
              <Button
                onClick={() => setShowAddTable(true)}
                data-testid="add-table-button"
                className="bg-primary hover:bg-primary/90 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <Card
                  key={table.id}
                  data-testid={`table-${table.id}`}
                  className="bg-white border-secondary p-4"
                >
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Utensils className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-bold text-primary">Table {table.table_number}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Capacity: {table.capacity} people
                    </div>
                    <Badge
                      className={
                        table.status === 'available'
                          ? 'bg-success'
                          : table.status === 'occupied'
                          ? 'bg-destructive'
                          : 'bg-warning'
                      }
                    >
                      {table.status}
                    </Badge>
                    {table.qr_image && (
                      <div className="space-y-2">
                        <img
                          src={table.qr_image}
                          alt={`QR Code for Table ${table.table_number}`}
                          className="w-32 h-32 mx-auto border border-secondary rounded"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadQRCode(table)}
                          data-testid={`download-qr-${table.id}`}
                          className="w-full"
                        >
                          <QrCode className="w-3 h-3 mr-2" />
                          Download QR
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Ingredient Dialog */}
      <Dialog open={showAddIngredient} onOpenChange={setShowAddIngredient}>
        <DialogContent className="sm:max-w-md" data-testid="add-ingredient-dialog">
          <DialogHeader>
            <DialogTitle>Add Ingredient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                data-testid="ingredient-name-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit (e.g., grams, ml)</label>
              <Input
                value={ingredientForm.unit}
                onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                data-testid="ingredient-unit-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Stock</label>
              <Input
                type="number"
                value={ingredientForm.current_stock}
                onChange={(e) =>
                  setIngredientForm({ ...ingredientForm, current_stock: parseFloat(e.target.value) })
                }
                data-testid="ingredient-current-stock-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Stock</label>
              <Input
                type="number"
                value={ingredientForm.min_stock}
                onChange={(e) =>
                  setIngredientForm({ ...ingredientForm, min_stock: parseFloat(e.target.value) })
                }
                data-testid="ingredient-min-stock-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost per Unit ($)</label>
              <Input
                type="number"
                step="0.01"
                value={ingredientForm.cost_per_unit}
                onChange={(e) =>
                  setIngredientForm({ ...ingredientForm, cost_per_unit: parseFloat(e.target.value) })
                }
                data-testid="ingredient-cost-input"
              />
            </div>
            <Button
              onClick={addIngredient}
              data-testid="submit-ingredient-button"
              className="w-full bg-primary hover:bg-primary/90 rounded-full"
            >
              Add Ingredient
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="sm:max-w-md" data-testid="add-product-dialog">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                data-testid="product-name-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                data-testid="product-description-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                data-testid="product-category-select"
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="beverage">Beverage</option>
                <option value="food">Food</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price ($)</label>
              <Input
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                data-testid="product-price-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
              <Input
                value={productForm.image_url}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                data-testid="product-image-input"
              />
            </div>
            <Button
              onClick={addProduct}
              data-testid="submit-product-button"
              className="w-full bg-primary hover:bg-primary/90 rounded-full"
            >
              Add Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add COGS Dialog */}
      <Dialog open={showAddCOGS} onOpenChange={setShowAddCOGS}>
        <DialogContent className="sm:max-w-md" data-testid="add-cogs-dialog">
          <DialogHeader>
            <DialogTitle>Add COGS Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={cogsForm.name}
                onChange={(e) => setCogsForm({ ...cogsForm, name: e.target.value })}
                data-testid="cogs-name-input"
                placeholder="e.g., Delivery Cost, Packaging"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={cogsForm.description}
                onChange={(e) => setCogsForm({ ...cogsForm, description: e.target.value })}
                data-testid="cogs-description-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Input
                value={cogsForm.category}
                onChange={(e) => setCogsForm({ ...cogsForm, category: e.target.value })}
                data-testid="cogs-category-input"
                placeholder="e.g., Delivery, Packaging, Labor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost ($)</label>
              <Input
                type="number"
                step="0.01"
                value={cogsForm.cost}
                onChange={(e) => setCogsForm({ ...cogsForm, cost: parseFloat(e.target.value) })}
                data-testid="cogs-cost-input"
              />
            </div>
            <Button
              onClick={addCOGS}
              data-testid="submit-cogs-button"
              className="w-full bg-primary hover:bg-primary/90 rounded-full"
            >
              Add COGS Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={showAddTable} onOpenChange={setShowAddTable}>
        <DialogContent className="sm:max-w-md" data-testid="add-table-dialog">
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Table Number</label>
              <Input
                type="number"
                value={tableForm.table_number}
                onChange={(e) => setTableForm({ ...tableForm, table_number: parseInt(e.target.value) })}
                data-testid="table-number-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacity (people)</label>
              <Input
                type="number"
                value={tableForm.capacity}
                onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) })}
                data-testid="table-capacity-input"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              A unique QR code will be automatically generated for this table.
            </p>
            <Button
              onClick={addTable}
              data-testid="submit-table-button"
              className="w-full bg-primary hover:bg-primary/90 rounded-full"
            >
              Add Table with QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryDashboard;
