import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  LogOut, Users, ShoppingBag, Coffee, LayoutGrid, 
  Plus, Trash2, Edit, DollarSign, Clock, CheckCircle 
} from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { user, logout } = useAuth();

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'customer',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load admin data');
      setLoading(false);
    }
  };

  const addUser = async () => {
    try {
      await api.post('/admin/users', userForm);
      toast.success('User created successfully');
      setShowAddUser(false);
      setUserForm({ email: '', password: '', name: '', role: 'customer' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      setEditingUser(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'cashier': return 'bg-blue-500';
      case 'waiter': return 'bg-purple-500';
      case 'kitchen': return 'bg-orange-500';
      case 'storage': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

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
              <h1 className="text-xl font-playfair font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-[#F5EEDC]">{user?.name}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            data-testid="admin-logout-button"
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6" data-testid="admin-dashboard">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#5A3A2A] p-4 text-white">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-[#D9A54C]" />
                <div>
                  <p className="text-2xl font-bold">{stats.users_count}</p>
                  <p className="text-sm text-[#F5EEDC]/70">Total Users</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#5A3A2A] p-4 text-white">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-[#D9A54C]" />
                <div>
                  <p className="text-2xl font-bold">{stats.orders_count}</p>
                  <p className="text-sm text-[#F5EEDC]/70">Total Orders</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#5A3A2A] p-4 text-white">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-[#4A7A5E]" />
                <div>
                  <p className="text-2xl font-bold">${stats.total_revenue?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-[#F5EEDC]/70">Total Revenue</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#5A3A2A] p-4 text-white">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending_orders}</p>
                  <p className="text-sm text-[#F5EEDC]/70">Pending Orders</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-[#5A3A2A] border border-[#6b4a3a]">
            <TabsTrigger value="users" data-testid="admin-users-tab" className="data-[state=active]:bg-[#D9A54C]">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="overview" data-testid="admin-overview-tab" className="data-[state=active]:bg-[#D9A54C]">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#F5EEDC]">All Users ({users.length})</h2>
              <Button
                onClick={() => setShowAddUser(true)}
                data-testid="admin-add-user-button"
                className="bg-[#D9A54C] hover:bg-[#c9944c] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-[#F5EEDC]">Loading users...</div>
            ) : (
              <div className="grid gap-3">
                {users.map((u) => (
                  <Card
                    key={u.id}
                    data-testid={`admin-user-${u.id}`}
                    className="bg-[#5A3A2A] p-4 text-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#D9A54C] flex items-center justify-center font-bold">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          <p className="text-sm text-[#F5EEDC]/70">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getRoleBadgeColor(u.role)} text-white`}>
                          {u.role}
                        </Badge>
                        <Button
                          onClick={() => setEditingUser(u)}
                          data-testid={`edit-user-${u.id}`}
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {u.id !== user?.id && (
                          <Button
                            onClick={() => deleteUser(u.id)}
                            data-testid={`delete-user-${u.id}`}
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#5A3A2A] p-6 text-white">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-[#D9A54C]" />
                  Products
                </h3>
                <p className="text-3xl font-bold">{stats?.products_count || 0}</p>
                <p className="text-sm text-[#F5EEDC]/70">Active products</p>
              </Card>
              <Card className="bg-[#5A3A2A] p-6 text-white">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-[#D9A54C]" />
                  Tables
                </h3>
                <p className="text-3xl font-bold">{stats?.tables_count || 0}</p>
                <p className="text-sm text-[#F5EEDC]/70">Configured tables</p>
              </Card>
              <Card className="bg-[#5A3A2A] p-6 text-white">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#4A7A5E]" />
                  Completed Orders
                </h3>
                <p className="text-3xl font-bold">{stats?.completed_orders || 0}</p>
                <p className="text-sm text-[#F5EEDC]/70">Successfully fulfilled</p>
              </Card>
              <Card className="bg-[#5A3A2A] p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">User Roles Distribution</h3>
                <div className="space-y-2">
                  {['admin', 'cashier', 'waiter', 'kitchen', 'storage', 'customer'].map(role => {
                    const count = users.filter(u => u.role === role).length;
                    return (
                      <div key={role} className="flex justify-between items-center">
                        <Badge className={`${getRoleBadgeColor(role)} text-white`}>{role}</Badge>
                        <span className="font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add User Dialog */}
        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogContent className="bg-[#5A3A2A] text-white border-[#6b4a3a]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  data-testid="admin-new-user-name"
                  className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  data-testid="admin-new-user-email"
                  className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  data-testid="admin-new-user-password"
                  className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  data-testid="admin-new-user-role"
                  className="w-full mt-1 px-3 py-2 bg-[#1A1C1A] border border-[#6b4a3a] rounded-md text-white"
                >
                  <option value="customer">Customer</option>
                  <option value="cashier">Cashier</option>
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="storage">Storage Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button
                onClick={addUser}
                data-testid="admin-create-user-submit"
                className="w-full bg-[#D9A54C] hover:bg-[#c9944c]"
              >
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="bg-[#5A3A2A] text-white border-[#6b4a3a]">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">{editingUser.name}</p>
                  <p className="text-sm text-[#F5EEDC]/70">{editingUser.email}</p>
                </div>
                <div>
                  <Label>Assign Role</Label>
                  <select
                    defaultValue={editingUser.role}
                    onChange={(e) => updateUserRole(editingUser.id, e.target.value)}
                    data-testid="admin-edit-user-role"
                    className="w-full mt-1 px-3 py-2 bg-[#1A1C1A] border border-[#6b4a3a] rounded-md text-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="cashier">Cashier</option>
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen Staff</option>
                    <option value="storage">Storage Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
