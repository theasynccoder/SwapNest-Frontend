import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail, Lock, User, Phone, Loader2 } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });
  // OTP state for signup
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // Handles both login and signup (with OTP for signup)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        // Admin login shortcut
        if (
          formData.email === "mamughees292@gmail.com" &&
          formData.password === "123456"
        ) {
          const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          if (error) throw error;
          toast.success("Welcome back, Admin!");
          navigate("/admin/payments");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        // Always send OTP and redirect to verification page
        const res = await fetch(
          "https://swapnest-backend-jdip.onrender.com/send-otp",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send OTP");
        toast.success("Verification code sent to your email");
        // Redirect to verification page with form data
        navigate("/verify-email", { state: { ...formData } });
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
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
            <span className="text-2xl font-bold text-primary-foreground">
              S
            </span>
          </div>
          <span className="font-display text-3xl font-bold text-primary-foreground">
            SwapNest
          </span>
        </Link>
        <div>
          <h1 className="font-display text-4xl font-bold text-primary-foreground mb-4">
            {isLogin ? "Welcome back!" : "Join the community"}
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
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 lg:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="bg-card rounded-2xl shadow-xl p-8">
            <h2 className="font-display text-2xl font-bold mb-2">
              {isLogin ? "Sign in" : "Create account"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !otpSent && (
                <>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="pl-10"
                        required
                        disabled={loading}
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
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}
              {!isLogin && otpSent && (
                <div>
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="relative mt-1">
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter the 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check your email for the code.
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-10"
                    required
                    disabled={loading || otpSent}
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
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10"
                    required
                    minLength={6}
                    disabled={loading || otpSent}
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? "Signing in..." : "Sending code..."}
                  </>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
              {/* No resend code button, handled on verification page */}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
