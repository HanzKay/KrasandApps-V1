import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LogIn, UserPlus, Crown } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (userRole) => {
    switch (userRole) {
      case 'admin': return '/admin';
      case 'kitchen': return '/kitchen';
      case 'cashier': return '/pos';
      case 'waiter': return '/waiter';
      case 'storage': return '/storage';
      default: return '/';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      navigate(redirectByRole(user.role));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Customer registration only - no role parameter
      const user = await register(email, password, name, isMember);
      toast.success(isMember ? 'Welcome to Kopi Krasand! You are now a member.' : 'Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EEDC] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_eatease-19/artifacts/ks9z3yrd_KopiKrasand.png" 
              alt="Kopi Krasand"
              className="h-20"
            />
          </div>
          <p className="text-muted-foreground">Welcome to Kopi Krasand</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-secondary p-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Join Us</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="login-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    data-testid="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="login-submit-button"
                  className="w-full rounded-full bg-[#5A3A2A] hover:bg-[#4a2a1a] text-white py-6"
                  disabled={loading}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
              <p className="text-xs text-center text-muted-foreground mt-4">
                Staff members: Please contact admin for account access
              </p>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="reg-name">Your Name</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    data-testid="register-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    data-testid="register-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    data-testid="register-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
                
                {/* Membership Option */}
                <div className="bg-[#F5EEDC] rounded-lg p-4 border border-[#D9A54C]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMember}
                      onChange={(e) => setIsMember(e.target.checked)}
                      data-testid="register-member-checkbox"
                      className="mt-1 w-4 h-4 accent-[#D9A54C]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-[#D9A54C]" />
                        <span className="font-semibold text-[#5A3A2A]">Join as Member</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Get exclusive discounts, earn points, and receive special offers!
                      </p>
                    </div>
                  </label>
                </div>

                <Button
                  type="submit"
                  data-testid="register-submit-button"
                  className="w-full rounded-full bg-[#5A3A2A] hover:bg-[#4a2a1a] text-white py-6"
                  disabled={loading}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {loading ? 'Creating account...' : (isMember ? 'Join as Member' : 'Create Account')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            data-testid="back-to-home-button"
            className="text-[#5A3A2A] hover:text-[#4a2a1a]"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;