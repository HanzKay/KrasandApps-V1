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
  LogOut, Users, ShoppingBag, LayoutGrid, 
  Plus, Trash2, Edit, DollarSign, Clock, CheckCircle,
  Crown, Gift, Coffee, Wifi, Percent, Calendar, UserPlus,
  ClipboardList, Eye
} from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAssignMembership, setShowAssignMembership] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { user, logout } = useAuth();

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'customer',
  });

  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    duration_type: 'months',
    duration_value: 12,
    is_group: false,
    color: '#D9A54C',
    benefits: [{ benefit_type: 'food_discount', value: 10, description: '10% off food' }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes, programsRes, membershipsRes, ordersRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
        api.get('/admin/programs'),
        api.get('/admin/memberships?status=active'),
        api.get('/orders'),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setPrograms(programsRes.data);
      setMemberships(membershipsRes.data);
      setOrders(ordersRes.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load admin data');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'ready': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'pending': return 'bg-orange-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
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

  // Program functions
  const addProgram = async () => {
    try {
      await api.post('/admin/programs', programForm);
      toast.success('Program created successfully');
      setShowAddProgram(false);
      resetProgramForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create program');
    }
  };

  const updateProgram = async () => {
    try {
      await api.put(`/admin/programs/${editingProgram.id}`, programForm);
      toast.success('Program updated successfully');
      setEditingProgram(null);
      resetProgramForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update program');
    }
  };

  const deleteProgram = async (programId) => {
    if (!window.confirm('Delete this program? All memberships will be cancelled.')) return;
    try {
      await api.delete(`/admin/programs/${programId}`);
      toast.success('Program deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete program');
    }
  };

  const resetProgramForm = () => {
    setProgramForm({
      name: '',
      description: '',
      duration_type: 'months',
      duration_value: 12,
      is_group: false,
      color: '#D9A54C',
      benefits: [{ benefit_type: 'food_discount', value: 10, description: '10% off food' }],
    });
  };

  const addBenefit = () => {
    setProgramForm({
      ...programForm,
      benefits: [...programForm.benefits, { benefit_type: 'food_discount', value: 10, description: '' }],
    });
  };

  const removeBenefit = (index) => {
    setProgramForm({
      ...programForm,
      benefits: programForm.benefits.filter((_, i) => i !== index),
    });
  };

  const updateBenefit = (index, field, value) => {
    const newBenefits = [...programForm.benefits];
    newBenefits[index][field] = value;
    setProgramForm({ ...programForm, benefits: newBenefits });
  };

  // Membership functions
  const assignMembership = async (programId) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one customer');
      return;
    }
    try {
      await api.post('/admin/memberships', {
        program_id: programId,
        customer_ids: selectedUsers,
      });
      toast.success('Membership assigned successfully');
      setShowAssignMembership(false);
      setSelectedUsers([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign membership');
    }
  };

  const cancelMembership = async (membershipId) => {
    if (!window.confirm('Cancel this membership?')) return;
    try {
      await api.delete(`/admin/memberships/${membershipId}`);
      toast.success('Membership cancelled');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel membership');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
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

  const getBenefitIcon = (type) => {
    switch (type) {
      case 'food_discount': return <Coffee className="w-4 h-4" />;
      case 'beverage_discount': return <Coffee className="w-4 h-4" />;
      case 'wifi_discount': return <Wifi className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const customerUsers = users.filter(u => u.role === 'customer');

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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-[#5A3A2A] p-4 text-white">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-[#D9A54C]" />
                <div>
                  <p className="text-2xl font-bold">{stats.users_count}</p>
                  <p className="text-sm text-[#F5EEDC]/70">Users</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#5A3A2A] p-4 text-white">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-[#D9A54C]" />
                <div>
                  <p className="text-2xl font-bold">{stats.active_memberships || 0}</p>
                  <p className="text-sm text-[#F5EEDC]/70">Members</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#5A3A2A] p-4 text-white">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-[#D9A54C]" />
                <div>
                  <p className="text-2xl font-bold">{stats.orders_count}</p>
                  <p className="text-sm text-[#F5EEDC]/70">Orders</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#5A3A2A] p-4 text-white">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-[#4A7A5E]" />
                <div>
                  <p className="text-2xl font-bold">${stats.total_revenue?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-[#F5EEDC]/70">Revenue</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#5A3A2A] p-4 text-white">
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.programs_count || 0}</p>
                  <p className="text-sm text-[#F5EEDC]/70">Programs</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-[#5A3A2A] border border-[#6b4a3a]">
            <TabsTrigger value="users" data-testid="admin-users-tab" className="data-[state=active]:bg-[#D9A54C]">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="admin-orders-tab" className="data-[state=active]:bg-[#D9A54C]">
              <ClipboardList className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="programs" data-testid="admin-programs-tab" className="data-[state=active]:bg-[#D9A54C]">
              <Crown className="w-4 h-4 mr-2" />
              Loyalty Programs
            </TabsTrigger>
            <TabsTrigger value="memberships" data-testid="admin-memberships-tab" className="data-[state=active]:bg-[#D9A54C]">
              <Gift className="w-4 h-4 mr-2" />
              Memberships
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
                {users.map((u) => {
                  const userMemberships = memberships.filter(m => m.customer_id === u.id);
                  return (
                    <Card key={u.id} data-testid={`admin-user-${u.id}`} className="bg-[#5A3A2A] p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#D9A54C] flex items-center justify-center font-bold">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{u.name}</p>
                              {userMemberships.length > 0 && (
                                <Crown className="w-4 h-4 text-[#D9A54C]" />
                              )}
                            </div>
                            <p className="text-sm text-[#F5EEDC]/70">{u.email}</p>
                            {userMemberships.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {userMemberships.map(m => (
                                  <Badge key={m.id} style={{ backgroundColor: m.program_color || '#D9A54C' }} className="text-xs">
                                    {m.program_name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${getRoleBadgeColor(u.role)} text-white`}>{u.role}</Badge>
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
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#F5EEDC]">All Orders ({orders.length})</h2>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12 text-[#F5EEDC]/60">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card 
                    key={order.id} 
                    className="bg-[#5A3A2A] p-4 border-[#6b4a3a] cursor-pointer hover:border-[#D9A54C] transition-all"
                    onClick={() => viewOrderDetails(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#D9A54C]/20 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-[#D9A54C]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#F5EEDC]">
                            Order #{order.order_number}
                          </h3>
                          <p className="text-sm text-[#F5EEDC]/60">
                            {order.customer_name || 'Guest'} • {order.order_type}
                          </p>
                          <p className="text-xs text-[#F5EEDC]/40">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#D9A54C]">
                            ${order.total_amount?.toFixed(2) || '0.00'}
                          </p>
                          <p className="text-xs text-[#F5EEDC]/60">
                            {order.items?.length || 0} items
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#D9A54C] text-[#D9A54C] hover:bg-[#D9A54C]/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewOrderDetails(order);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#F5EEDC]">Loyalty Programs ({programs.length})</h2>
              <Button
                onClick={() => { resetProgramForm(); setShowAddProgram(true); }}
                data-testid="admin-add-program-button"
                className="bg-[#D9A54C] hover:bg-[#c9944c] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Program
              </Button>
            </div>

            {programs.length === 0 ? (
              <div className="text-center py-12 text-[#F5EEDC]/60">
                <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No loyalty programs yet</p>
                <p className="text-sm">Create your first program to reward customers</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {programs.map((p) => (
                  <Card key={p.id} data-testid={`program-${p.id}`} className="bg-[#5A3A2A] p-5 text-white">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: p.color }}>
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{p.name}</h3>
                          <p className="text-sm text-[#F5EEDC]/70">{p.description}</p>
                        </div>
                      </div>
                      <Badge className={p.is_group ? 'bg-purple-500' : 'bg-blue-500'}>
                        {p.is_group ? 'Group' : 'Individual'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-[#F5EEDC]/70">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {p.duration_type === 'lifetime' ? 'Lifetime' : `${p.duration_value} ${p.duration_type}`}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {p.active_members || 0} members
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-xs text-[#F5EEDC]/50 uppercase">Benefits</p>
                      {p.benefits?.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-[#1A1C1A] rounded px-3 py-2">
                          {getBenefitIcon(b.benefit_type)}
                          <span>{b.description || `${b.value}% ${b.benefit_type.replace('_', ' ')}`}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => { 
                          setProgramForm({...p, benefits: p.benefits || []});
                          setEditingProgram(p);
                        }}
                        size="sm"
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAssignMembership(true);
                          setEditingProgram(p);
                        }}
                        size="sm"
                        className="flex-1 bg-[#4A7A5E] hover:bg-[#3d6550]"
                      >
                        <UserPlus className="w-4 h-4 mr-1" /> Assign
                      </Button>
                      <Button
                        onClick={() => deleteProgram(p.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Memberships Tab */}
          <TabsContent value="memberships" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#F5EEDC]">Active Memberships ({memberships.length})</h2>
            </div>

            {memberships.length === 0 ? (
              <div className="text-center py-12 text-[#F5EEDC]/60">
                <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active memberships</p>
                <p className="text-sm">Assign customers to loyalty programs</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {memberships.map((m) => (
                  <Card key={m.id} data-testid={`membership-${m.id}`} className="bg-[#5A3A2A] p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#D9A54C] flex items-center justify-center">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{m.customer_name}</p>
                          <p className="text-sm text-[#F5EEDC]/70">{m.customer_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge className="bg-[#4A7A5E]">{m.program_name}</Badge>
                          <p className="text-xs text-[#F5EEDC]/50 mt-1">
                            {m.end_date ? `Expires: ${new Date(m.end_date).toLocaleDateString()}` : 'Lifetime'}
                          </p>
                        </div>
                        <Button
                          onClick={() => cancelMembership(m.id)}
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
              <Button onClick={addUser} data-testid="admin-create-user-submit" className="w-full bg-[#D9A54C] hover:bg-[#c9944c]">
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Role Dialog */}
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

        {/* Add/Edit Program Dialog */}
        <Dialog open={showAddProgram || !!editingProgram} onOpenChange={() => { setShowAddProgram(false); setEditingProgram(null); resetProgramForm(); }}>
          <DialogContent className="bg-[#5A3A2A] text-white border-[#6b4a3a] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProgram ? 'Edit Program' : 'Create Loyalty Program'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Program Name</Label>
                  <Input
                    value={programForm.name}
                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                    placeholder="Gold Member"
                    className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                  />
                </div>
                <div>
                  <Label>Badge Color</Label>
                  <div className="flex gap-2 mt-1">
                    {['#D9A54C', '#4A7A5E', '#5A3A2A', '#E74C3C', '#9B59B6', '#3498DB'].map(color => (
                      <button
                        key={color}
                        onClick={() => setProgramForm({ ...programForm, color })}
                        className={`w-8 h-8 rounded-full border-2 ${programForm.color === color ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={programForm.description}
                  onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  placeholder="Exclusive benefits for our loyal customers"
                  className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Duration Type</Label>
                  <select
                    value={programForm.duration_type}
                    onChange={(e) => setProgramForm({ ...programForm, duration_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-[#1A1C1A] border border-[#6b4a3a] rounded-md text-white"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                {programForm.duration_type !== 'lifetime' && (
                  <div>
                    <Label>Duration Value</Label>
                    <Input
                      type="number"
                      value={programForm.duration_value}
                      onChange={(e) => setProgramForm({ ...programForm, duration_value: parseInt(e.target.value) || 0 })}
                      className="bg-[#1A1C1A] border-[#6b4a3a] text-white"
                    />
                  </div>
                )}
                <div>
                  <Label>Program Type</Label>
                  <select
                    value={programForm.is_group ? 'group' : 'individual'}
                    onChange={(e) => setProgramForm({ ...programForm, is_group: e.target.value === 'group' })}
                    className="w-full mt-1 px-3 py-2 bg-[#1A1C1A] border border-[#6b4a3a] rounded-md text-white"
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Benefits</Label>
                  <Button onClick={addBenefit} size="sm" variant="outline" className="border-[#D9A54C] text-[#D9A54C]">
                    <Plus className="w-4 h-4 mr-1" /> Add Benefit
                  </Button>
                </div>
                <div className="space-y-3">
                  {programForm.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2 items-start bg-[#1A1C1A] p-3 rounded">
                      <select
                        value={benefit.benefit_type}
                        onChange={(e) => updateBenefit(index, 'benefit_type', e.target.value)}
                        className="px-2 py-1 bg-[#5A3A2A] border border-[#6b4a3a] rounded text-white text-sm"
                      >
                        <option value="food_discount">Food Discount</option>
                        <option value="beverage_discount">Beverage Discount</option>
                        <option value="wifi_discount">WiFi Discount</option>
                        <option value="custom">Custom</option>
                      </select>
                      {benefit.benefit_type !== 'custom' && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={benefit.value}
                            onChange={(e) => updateBenefit(index, 'value', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-[#5A3A2A] border-[#6b4a3a] text-white"
                          />
                          <Percent className="w-4 h-4 text-[#F5EEDC]/50" />
                        </div>
                      )}
                      <Input
                        value={benefit.description}
                        onChange={(e) => updateBenefit(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="flex-1 bg-[#5A3A2A] border-[#6b4a3a] text-white"
                      />
                      <Button onClick={() => removeBenefit(index)} size="sm" variant="ghost" className="text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={editingProgram ? updateProgram : addProgram} 
                className="w-full bg-[#D9A54C] hover:bg-[#c9944c]"
              >
                {editingProgram ? 'Update Program' : 'Create Program'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Membership Dialog */}
        <Dialog open={showAssignMembership} onOpenChange={() => { setShowAssignMembership(false); setSelectedUsers([]); }}>
          <DialogContent className="bg-[#5A3A2A] text-white border-[#6b4a3a] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Membership: {editingProgram?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-[#F5EEDC]/70">Select customers to assign this program:</p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customerUsers.length === 0 ? (
                  <p className="text-center py-4 text-[#F5EEDC]/50">No customers found</p>
                ) : (
                  customerUsers.map((u) => {
                    const hasMembership = memberships.some(m => m.customer_id === u.id && m.program_id === editingProgram?.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-3 p-3 rounded cursor-pointer ${
                          selectedUsers.includes(u.id) ? 'bg-[#D9A54C]/20 border border-[#D9A54C]' : 'bg-[#1A1C1A]'
                        } ${hasMembership ? 'opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={() => !hasMembership && toggleUserSelection(u.id)}
                          disabled={hasMembership}
                          className="w-4 h-4 accent-[#D9A54C]"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{u.name}</p>
                          <p className="text-sm text-[#F5EEDC]/70">{u.email}</p>
                        </div>
                        {hasMembership && (
                          <Badge className="bg-[#4A7A5E]">Already assigned</Badge>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#6b4a3a]">
                <p className="text-sm">{selectedUsers.length} selected</p>
                <Button 
                  onClick={() => assignMembership(editingProgram?.id)}
                  disabled={selectedUsers.length === 0}
                  className="bg-[#4A7A5E] hover:bg-[#3d6550]"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Membership
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
