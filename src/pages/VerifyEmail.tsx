import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, password, fullName, phone } = location.state || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('https://swapnest-backend-jdip.onrender.com/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          name: fullName,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      toast.success('Account created! You can now sign in.');
      navigate('/?mode=signin');
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return <div className="p-8">Missing registration info. Please start again.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="font-display text-2xl font-bold mb-2">Verify Your Email</h2>
        <p className="mb-4 text-muted-foreground">Enter the 6-digit code sent to <span className="font-medium">{email}</span>.</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter code"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={6}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>) : 'Verify & Create Account'}
          </Button>
        </form>
        <button
          type="button"
          className="text-xs text-primary mt-4 hover:underline"
          disabled={loading}
          onClick={() => navigate(-1)}
        >
          Change email or resend code
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
