import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, User, Phone, Loader2 } from 'lucide-react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
            },
          },
        });
        if (error) throw error;
        toast.success('Account created! Welcome to SwapNest!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-dark p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <span className="font-display text-3xl font-bold text-primary-foreground">SwapNest</span>
        </Link>
        <div>
          <h1 className="font-display text-4xl font-bold text-primary-foreground mb-4">
            {isLogin ? 'Welcome back!' : 'Join the community'}
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            Connect with fellow students to buy and sell used items safely.
          </p>
        </div>
        <p className="text-primary-foreground/50 text-sm">© 2024 SwapNest</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 lg:hidden">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="bg-card rounded-2xl shadow-xl p-8">
            <h2 className="font-display text-2xl font-bold mb-2">
              {isLogin ? 'Sign in' : 'Create account'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email">College Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
