import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  CheckCircle2,
  Package,
  Clock,
  AlertCircle,
  Zap,
  Crown,
  Sparkles,
  QrCode,
  Upload,
  IndianRupee,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { SubscriptionPlan } from "@/lib/types";

const Subscription = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [verifiedSubscriptions, setVerifiedSubscriptions] = useState<any[]>([]);
  const [totalListingsRemaining, setTotalListingsRemaining] = useState(0);

  /* ---------- AUTH GUARD ---------- */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  /* ---------- INITIAL LOAD + REALTIME ---------- */
  useEffect(() => {
    if (!user) return;

    fetchPlans();
    fetchSubscriptionData();

    // Real-time subscription updates
    const subscriptionChannel = supabase
      .channel(`user_subscriptions_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log("📢 Subscription update received");
          setTimeout(() => {
            fetchSubscriptionData();
          }, 1000);
        }
      )
      .subscribe();

    // Real-time payment updates
    const paymentChannel = supabase
      .channel(`subscription_payments_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscription_payments",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log("📢 Payment update received");
          setTimeout(() => {
            fetchSubscriptionData();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
      supabase.removeChannel(paymentChannel);
    };
  }, [user]);

  /* ---------- FETCH PLANS ---------- */
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .neq("plan_type", "free")
        .order("price_inr");

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("❌ Error loading plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- FETCH ALL SUBSCRIPTION DATA ---------- */
  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      // Fetch all user subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          listings_remaining,
          payment_verified,
          verified_at,
          created_at,
          plan:subscription_plans(name, listing_count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (subError) throw subError;

      // Separate verified subscriptions
      const verified = subscriptions?.filter(
        (sub: any) => sub.payment_verified === true
      ) || [];

      setVerifiedSubscriptions(verified);

      // Calculate total listings
      const total = verified.reduce((sum, sub) => sum + (sub.listings_remaining || 0), 0);
      setTotalListingsRemaining(total);

      // Get verified subscription IDs
      const verifiedSubIds = verified.map((s: any) => s.id);

      // Fetch pending payments
      const { data: payments, error: payError } = await supabase
        .from("subscription_payments")
        .select(`
          id,
          user_id,
          subscription_id,
          amount_inr,
          payment_screenshot_url,
          is_verified,
          created_at
        `)
        .eq("user_id", user.id)
        .eq("is_verified", false)
        .order("created_at", { ascending: false });

      if (payError) throw payError;

      // Filter out payments for verified subscriptions
      const trulyPending = payments?.filter(
        (payment: any) => !verifiedSubIds.includes(payment.subscription_id)
      ) || [];

      console.log("✅ Verified:", verified.length, "Pending:", trulyPending.length);
      setPendingPayments(trulyPending);

    } catch (error: any) {
      console.error("❌ Error fetching subscription data:", error);
      toast.error("Failed to load subscription data");
    }
  };

  /* ---------- FILE SELECT ---------- */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setPaymentScreenshot(file);
  };

  /* ---------- SUBMIT PAYMENT ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan || !paymentScreenshot || !user) {
      toast.error("Missing required information");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const selectedPlanData = plans.find(p => p.id === selectedPlan);

          if (!selectedPlanData) {
            throw new Error("Selected plan not found");
          }

          console.log("📝 Creating subscription for user:", user.id);
          console.log("📋 Plan details:", { id: selectedPlan, name: selectedPlanData.name, price: selectedPlanData.price_inr });

          // Create subscription
          const { data: subscription, error: subError } = await supabase
            .from("user_subscriptions")
            .insert({
              user_id: user.id,
              plan_id: selectedPlan,
              listings_remaining: selectedPlanData.listing_count,
              payment_verified: false,
              payment_screenshot_url: base64,
            })
            .select()
            .single();

          if (subError) {
            console.error("❌ Subscription error:", subError);
            console.error("Error code:", subError.code);
            console.error("Error message:", subError.message);
            console.error("Error details:", subError.details);
            throw new Error(`Subscription creation failed: ${subError.message}`);
          }

          if (!subscription) {
            throw new Error("No subscription returned after insert");
          }

          console.log("✅ Subscription created:", {
            id: subscription.id,
            user_id: subscription.user_id,
            plan_id: subscription.plan_id,
            payment_verified: subscription.payment_verified,
          });

          // Create payment record
          console.log("📝 Creating payment record for subscription:", subscription.id);
          
          const { data: paymentData, error: paymentError } = await supabase
            .from("subscription_payments")
            .insert({
              user_id: user.id,
              subscription_id: subscription.id,
              amount_inr: selectedPlanData.price_inr,
              payment_screenshot_url: base64,
              is_verified: false,
            })
            .select()
            .single();

          if (paymentError) {
            console.error("❌ Payment error:", paymentError);
            console.error("Error code:", paymentError.code);
            console.error("Error message:", paymentError.message);
            console.error("Error details:", paymentError.details);
            throw new Error(`Payment creation failed: ${paymentError.message}`);
          }

          if (!paymentData) {
            throw new Error("No payment returned after insert");
          }

          console.log("✅ Payment record created:", {
            id: paymentData.id,
            user_id: paymentData.user_id,
            subscription_id: paymentData.subscription_id,
            amount_inr: paymentData.amount_inr,
            is_verified: paymentData.is_verified,
          });

          console.log("💾 Data saved successfully to database");
          console.log("🎯 Admin dashboard should now show pending payment");

          toast.success(
            "🎉 Payment submitted successfully!",
            {
              description: "Admin will verify within 24 hours",
              duration: 5000
            }
          );

          // Reset form
          setSelectedPlan(null);
          setPaymentScreenshot(null);

          // Wait a bit for database to update, then refresh
          await new Promise(resolve => setTimeout(resolve, 2000));
          await fetchSubscriptionData();

        } catch (error: any) {
          console.error("❌ Submission error:", error);
          console.error("Full error object:", error);
          toast.error(error.message || "Failed to submit payment");
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = (error) => {
        console.error("❌ FileReader error:", error);
        toast.error("Failed to read file");
        setUploading(false);
      };

      reader.readAsDataURL(paymentScreenshot);

    } catch (error: any) {
      console.error("❌ Error:", error);
      toast.error(error.message || "Failed to submit payment");
      setUploading(false);
    }
  };

  /* ---------- LOADING ---------- */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const selectedPlanData = selectedPlan ? plans.find(p => p.id === selectedPlan) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SwapNest</span>
          </Link>

          <div className="flex items-center gap-4">
            {totalListingsRemaining > 0 && (
              <Badge variant="secondary">
                <Package className="w-3 h-3 mr-1" />
                {totalListingsRemaining} listings
              </Badge>
            )}
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Subscription Plans</h1>
          <p className="text-lg text-muted-foreground">
            Get more listings and reach more buyers. Choose a plan that fits your needs.
          </p>
        </div>

        {/* Status Overview */}
        {(verifiedSubscriptions.length > 0 || pendingPayments.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {verifiedSubscriptions.length > 0 && (
              <Card className="border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <p className="font-semibold">Active Subscriptions</p>
                      </div>
                      <p className="text-2xl font-bold">{verifiedSubscriptions.length}</p>
                    </div>
                    <Crown className="w-10 h-10 text-green-500/30" />
                  </div>
                </CardContent>
              </Card>
            )}

            {pendingPayments.length > 0 && (
              <Card className="border-orange-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <p className="font-semibold">Pending Verification</p>
                      </div>
                      <p className="text-2xl font-bold">{pendingPayments.length}</p>
                    </div>
                    <AlertCircle className="w-10 h-10 text-orange-500/30" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedPlan === plan.id ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {plan.name}
                    {selectedPlan === plan.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </CardTitle>
                </div>
                <CardDescription>{plan.listing_count} listings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <IndianRupee className="w-6 h-6" />
                    <span className="text-4xl font-bold">{plan.price_inr}</span>
                    <span className="text-muted-foreground">one-time</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {plan.listing_count} product listings
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    No expiration
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Instant activation
                  </li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Form */}
        {selectedPlan && selectedPlanData && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Payment</CardTitle>
              <CardDescription>
                Upload screenshot of payment for admin verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left: QR Code */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Payment QR Code
                  </h3>
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center min-h-[250px]">
                    <img
                      src="/qr-code.jpg"
                      alt="Payment QR"
                      className="w-48 h-48 object-contain"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        console.log("❌ QR code image not found, showing fallback");
                        
                        // Try .png if .jpg fails
                        if (img.src.includes('.jpg')) {
                          img.src = '/qr-code.png';
                          return;
                        }
                        
                        // If both fail, show SVG placeholder
                        const svg = `
                          <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <rect width="200" height="200" fill="#f3f4f6"/>
                            <circle cx="50" cy="50" r="15" fill="#d1d5db"/>
                            <circle cx="150" cy="50" r="15" fill="#d1d5db"/>
                            <circle cx="50" cy="150" r="15" fill="#d1d5db"/>
                            <rect x="40" y="40" width="120" height="120" fill="none" stroke="#d1d5db" stroke-width="2"/>
                            <text x="100" y="105" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">
                              QR Code
                            </text>
                            <text x="100" y="125" text-anchor="middle" font-size="10" fill="#9ca3af" font-family="sans-serif">
                              Add qr-code.jpg
                            </text>
                            <text x="100" y="140" text-anchor="middle" font-size="10" fill="#9ca3af" font-family="sans-serif">
                              to public folder
                            </text>
                          </svg>
                        `;
                        img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Scan to pay ₹{selectedPlanData.price_inr}
                  </p>
                </div>

                {/* Right: Upload Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="screenshot" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Payment Screenshot
                    </Label>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="mt-2"
                    />
                    {paymentScreenshot && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {paymentScreenshot.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Process:</p>
                    <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Scan QR code and pay ₹{selectedPlanData.price_inr}</li>
                      <li>Take screenshot of confirmation</li>
                      <li>Upload screenshot</li>
                      <li>Wait 24-48 hours for verification</li>
                    </ol>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    disabled={uploading || !paymentScreenshot}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Submit Payment
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Button */}
        {selectedPlan && (
          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSelectedPlan(null);
                setPaymentScreenshot(null);
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Selection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;