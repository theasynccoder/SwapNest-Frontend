// import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Loader2, CheckCircle2 } from "lucide-react";
// import { toast } from "sonner";

// type Payment = {
//   id: string;
//   user_id: string;
//   subscription_id: string;
//   amount_inr: number;
//   payment_screenshot_url: string;
//   is_verified: boolean;
//   created_at: string;
//   subscription?: {
//     id: string;
//     payment_verified: boolean;
//     plan?: { name: string; listing_count: number };
//   };
// };

// const AdminDashboard = () => {
//   const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [verifying, setVerifying] = useState<string | null>(null);

//   useEffect(() => {
//     fetchPendingPayments();
//   }, []);

//   const fetchPendingPayments = async () => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from("subscription_payments")
//         .select(
//           `
//           id,
//           user_id,
//           subscription_id,
//           amount_inr,
//           payment_screenshot_url,
//           is_verified,
//           created_at,
//           subscription:user_subscriptions(
//             id,
//             payment_verified,
//             plan:subscription_plans(name, listing_count)
//           )
//         `
//         )
//         .eq("is_verified", false)
//         .order("created_at", { ascending: false });

//       if (error) {
//         console.error("❌ Error fetching payments:", error);
//         toast.error("Failed to fetch pending payments");
//         return;
//       }

//       if (data) {
//         console.log("✅ Fetched pending payments:", data);
//         setPendingPayments(data as unknown as Payment[]);
//       }
//     } catch (err: any) {
//       console.error("❌ Exception:", err);
//       toast.error("An error occurred while fetching payments");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const cleanUpOldPendingPayments = async (subscription_id: string) => {
//     try {
//       const { data, error } = await supabase
//         .from("subscription_payments")
//         .select("id")
//         .eq("subscription_id", subscription_id)
//         .eq("is_verified", false)
//         .order("created_at", { ascending: false });

//       if (error) {
//         console.error("❌ Error fetching old payments:", error);
//         return;
//       }

//       if (data && data.length > 0) {
//         const idsToDelete = data.slice(1).map((p: any) => p.id);
//         if (idsToDelete.length > 0) {
//           const { error: deleteError } = await supabase
//             .from("subscription_payments")
//             .delete()
//             .in("id", idsToDelete);

//           if (deleteError) {
//             console.error("❌ Error deleting old payments:", deleteError);
//           } else {
//             console.log("✅ Deleted old payments:", idsToDelete);
//           }
//         }
//       }
//     } catch (err: any) {
//       console.error("❌ Exception in cleanup:", err);
//     }
//   };

//   const handleVerify = async (payment: Payment) => {
//     setVerifying(payment.id);

//     try {
//       console.log("🔄 Verifying payment:", payment.id, "for subscription:", payment.subscription_id);

//       // Step 1: Mark payment as verified
//       const { error: paymentError } = await supabase
//         .from("subscription_payments")
//         .update({ is_verified: true })
//         .eq("id", payment.id);

//       if (paymentError) {
//         console.error("❌ Payment update failed:", paymentError);
//         toast.error("Failed to update payment");
//         setVerifying(null);
//         return;
//       }
//       console.log("✅ Payment marked as verified");

//       // Step 2: Mark subscription as verified
//       const { error: subscriptionError } = await supabase
//         .from("user_subscriptions")
//         .update({
//           payment_verified: true,
//           verified_at: new Date().toISOString(),
//         })
//         .eq("id", payment.subscription_id);

//       if (subscriptionError) {
//         console.error("❌ Subscription update failed:", subscriptionError);
//         toast.error("Failed to verify subscription");
//         setVerifying(null);
//         return;
//       }
//       console.log("✅ Subscription marked as verified");

//       // Step 3: Clean up old pending payments
//       await cleanUpOldPendingPayments(payment.subscription_id);

//       // Step 4: Remove from UI
//       setPendingPayments(prev =>
//         prev.filter(p => p.subscription_id !== payment.subscription_id)
//       );
//       setVerifying(null);

//       toast.success("Subscription verified and activated!");
//       console.log("✅ Verification complete");
//     } catch (error: any) {
//       console.error("❌ Verification failed:", error.message);
//       toast.error(error.message || "Verification failed");
//       setVerifying(null);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background py-8">
//       <div className="container mx-auto max-w-4xl">
//         <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
//         <p className="text-muted-foreground mb-8">
//           Verify subscription payments and activate user subscriptions
//         </p>

//         <Card>
//           <CardHeader>
//             <CardTitle>Pending Subscription Payments</CardTitle>
//             <CardDescription>
//               Review payment screenshots and verify subscriptions.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <div className="flex justify-center py-8">
//                 <Loader2 className="w-8 h-8 animate-spin" />
//               </div>
//             ) : pendingPayments.length === 0 ? (
//               <div className="text-center text-muted-foreground py-8">
//                 No pending payments to verify.
//               </div>
//             ) : (
//               <div className="space-y-8">
//                 {pendingPayments.map((payment) => (
//                   <div
//                     key={payment.id}
//                     className="border rounded-lg p-6 flex flex-col md:flex-row gap-6 items-start md:items-center"
//                   >
//                     {/* Screenshot */}
//                     <div className="flex-shrink-0">
//                       <img
//                         src={payment.payment_screenshot_url}
//                         alt="Payment Screenshot"
//                         className="w-48 h-48 object-contain border rounded-lg bg-muted"
//                         onError={(e) => {
//                           console.log("⚠️ Image failed to load for payment:", payment.id);
//                         }}
//                       />
//                     </div>

//                     {/* Details */}
//                     <div className="flex-1">
//                       <div className="mb-3">
//                         <span className="font-semibold">Plan:</span>{" "}
//                         {payment.subscription?.plan?.name || "N/A"}
//                       </div>
//                       <div className="mb-3">
//                         <span className="font-semibold">Amount:</span> ₹
//                         {payment.amount_inr}
//                       </div>
//                       <div className="mb-3">
//                         <span className="font-semibold">Listings:</span>{" "}
//                         {payment.subscription?.plan?.listing_count || 0}
//                       </div>
//                       <div className="mb-3">
//                         <span className="font-semibold">User ID:</span>{" "}
//                         <code className="text-xs bg-muted px-2 py-1 rounded">
//                           {payment.user_id.slice(0, 8)}...
//                         </code>
//                       </div>
//                       <div className="mb-4">
//                         <span className="font-semibold">Submitted:</span>{" "}
//                         {new Date(payment.created_at).toLocaleString()}
//                       </div>

//                       <Button
//                         onClick={() => handleVerify(payment)}
//                         disabled={verifying === payment.id}
//                         className="w-full md:w-auto"
//                       >
//                         {verifying === payment.id ? (
//                           <>
//                             <Loader2 className="w-4 h-4 animate-spin mr-2" />
//                             Verifying...
//                           </>
//                         ) : (
//                           <>
//                             <CheckCircle2 className="w-4 h-4 mr-2" />
//                             Verify & Activate
//                           </>
//                         )}
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  CreditCard, 
  ShoppingBag,
  IndianRupee,
  Calendar,
  User,
  TrendingUp,
  Package,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

type Payment = {
  id: string;
  user_id: string;
  subscription_id: string;
  amount_inr: number;
  payment_screenshot_url: string;
  is_verified: boolean;
  created_at: string;
  subscription?: {
    id: string;
    payment_verified: boolean;
    verified_at?: string;
    verified_by?: string;
    listings_remaining: number;
    plan?: { 
      name: string; 
      listing_count: number;
      price_inr: number;
    };
  };
  user_profile?: {
    full_name: string;
    college_email: string;
  };
};

type DashboardStats = {
  totalPendingPayments: number;
  totalSubscriptions: number;
  totalRevenue: number;
  todayPending: number;
  activeUsers: number;
  totalProducts: number;
  recentVerified: number;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPendingPayments: 0,
    totalSubscriptions: 0,
    totalRevenue: 0,
    todayPending: 0,
    activeUsers: 0,
    totalProducts: 0,
    recentVerified: 0
  });
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    // Check if user is admin using localStorage ONLY
    const isAdminFlag = localStorage.getItem("is_admin");
    const storedAdminEmail = localStorage.getItem("user_email");
    
    console.log("🔐 Admin check:", { isAdminFlag, storedAdminEmail });

    if (isAdminFlag !== "true" || storedAdminEmail !== "mamughees292@gmail.com") {
      console.log("❌ Not admin, redirecting to /admin-login");
      navigate("/admin-login", { replace: true });
      return;
    }

    setAdminEmail(storedAdminEmail || "");
    console.log("✅ Admin verified, loading dashboard");

    fetchPendingPayments();
    fetchDashboardStats();

    // Set up real-time subscription - listen to ALL events
    const paymentsChannel = supabase
      .channel('admin_payments_all')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'subscription_payments',
        },
        (payload) => {
          console.log("📢 Payment change detected:", payload.eventType);
          console.log("📌 Payload:", payload.new || payload.old);
          // Refresh payments when ANY change happens
          setTimeout(() => {
            console.log("⏱️ Fetching after real-time event...");
            fetchPendingPayments();
            fetchDashboardStats();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log("📡 Payments channel status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("✅ Successfully subscribed to payment changes");
        }
      });

    const subscriptionsChannel = supabase
      .channel('admin_subscriptions_all')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_subscriptions',
        },
        (payload) => {
          console.log("📢 Subscription change detected:", payload.eventType);
          // Refresh both stats and payments
          setTimeout(() => {
            fetchPendingPayments();
            fetchDashboardStats();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log("📡 Subscriptions channel status:", status);
      });

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(subscriptionsChannel);
    };
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      console.log("📊 Fetching dashboard stats...");
      
      // Get today's date for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // 1. Total pending payments
      const { count: pendingCount } = await supabase
        .from("subscription_payments")
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false);

      // 2. Today's pending payments
      const { count: todayPendingCount } = await supabase
        .from("subscription_payments")
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)
        .gte('created_at', todayISO);

      // 3. Total verified subscriptions
      const { count: subscriptionsCount } = await supabase
        .from("user_subscriptions")
        .select('*', { count: 'exact', head: true })
        .eq('payment_verified', true);

      // 4. Total revenue (sum of verified payments)
      const { data: revenueData } = await supabase
        .from("subscription_payments")
        .select('amount_inr')
        .eq('is_verified', true);

      const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount_inr, 0) || 0;

      // 5. Active users (users with verified subscriptions)
      const { count: activeUsersCount } = await supabase
        .from("user_subscriptions")
        .select('user_id', { count: 'exact', head: true })
        .eq('payment_verified', true);

      // 6. Total products
      const { count: productsCount } = await supabase
        .from("products")
        .select('*', { count: 'exact', head: true });

      // 7. Recently verified (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: recentVerifiedCount } = await supabase
        .from("subscription_payments")
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)
        .gte('verified_at', weekAgo.toISOString());

      setStats({
        totalPendingPayments: pendingCount || 0,
        todayPending: todayPendingCount || 0,
        totalSubscriptions: subscriptionsCount || 0,
        totalRevenue: totalRevenue,
        activeUsers: activeUsersCount || 0,
        totalProducts: productsCount || 0,
        recentVerified: recentVerifiedCount || 0
      });

    } catch (error) {
      console.error("❌ Error fetching dashboard stats:", error);
    }
  };

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching pending payments (2-step)...");
      // Step 1: Fetch all unverified payments
      const { data: payments, error: paymentsError } = await supabase
        .from("subscription_payments")
        .select("id, user_id, subscription_id, amount_inr, payment_screenshot_url, is_verified, created_at")
        .eq("is_verified", false)
        .order("created_at", { ascending: false });

      if (paymentsError) {
        console.error("❌ Error fetching payments:", paymentsError);
        toast.error("Failed to fetch pending payments");
        setPendingPayments([]);
        return;
      }

      if (!payments || payments.length === 0) {
        setPendingPayments([]);
        return;
      }

      // Step 2: Fetch related subscriptions and plans in batch
      const subscriptionIds = payments.map(p => p.subscription_id);
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from("user_subscriptions")
        .select("id, payment_verified, verified_at, verified_by, listings_remaining, plan_id")
        .in("id", subscriptionIds);

      if (subscriptionsError) {
        console.error("❌ Error fetching subscriptions:", subscriptionsError);
        toast.error("Failed to fetch related subscriptions");
        setPendingPayments([]);
        return;
      }

      // Fetch all plan_ids in batch
      const planIds = Array.from(new Set(subscriptions.map(s => s.plan_id)));
      let plans = [];
      if (planIds.length > 0) {
        const { data: plansData, error: plansError } = await supabase
          .from("subscription_plans")
          .select("id, name, listing_count, price_inr")
          .in("id", planIds);
        if (plansError) {
          console.error("❌ Error fetching plans:", plansError);
          toast.error("Failed to fetch subscription plans");
        } else {
          plans = plansData || [];
        }
      }

      // Map subscriptions to include plan info
      const subscriptionsWithPlan = subscriptions.map(sub => ({
        ...sub,
        plan: plans.find(plan => plan.id === sub.plan_id) || null
      }));

      // Map payments to include subscription (with plan)
      const paymentsWithSubs = payments.map(payment => ({
        ...payment,
        subscription: subscriptionsWithPlan.find(sub => sub.id === payment.subscription_id) || null
      }));

      setPendingPayments(paymentsWithSubs);
    } catch (err: any) {
      console.error("❌ Exception:", err);
      toast.error("An error occurred while fetching payments");
      setPendingPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (payment: Payment) => {
    setVerifying(payment.id);

    try {
      console.log("🔄 Verifying payment:", payment.id, "for subscription:", payment.subscription_id);

      // Update both payment and subscription in parallel for better performance
      const [paymentResult, subscriptionResult] = await Promise.all([
        // Step 1: Mark payment as verified
        supabase
          .from("subscription_payments")
          .update({ 
            is_verified: true,
            verified_by: "admin",
            verified_at: new Date().toISOString()
          })
          .eq("id", payment.id),

        // Step 2: Mark subscription as verified
        supabase
          .from("user_subscriptions")
          .update({
            payment_verified: true,
            verified_by: "admin",
            verified_at: new Date().toISOString(),
          })
          .eq("id", payment.subscription_id)
      ]);

      if (paymentResult.error) {
        console.error("❌ Payment update failed:", paymentResult.error);
        toast.error("Failed to update payment");
        setVerifying(null);
        return;
      }

      if (subscriptionResult.error) {
        console.error("❌ Subscription update failed:", subscriptionResult.error);
        toast.error("Failed to verify subscription");
        setVerifying(null);
        return;
      }

      console.log("✅ Payment and subscription marked as verified");

      // Clean up old pending payments for this subscription
      await cleanUpOldPendingPayments(payment.subscription_id);

      // Update UI immediately
      setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
      setVerifying(null);

      // Update stats
      fetchDashboardStats();

      toast.success("Subscription verified and activated!", {
        description: `${payment.user_profile?.full_name || 'User'} now has access to ${payment.subscription?.plan?.listing_count || 0} listings.`
      });

      console.log("✅ Verification complete");
    } catch (error: any) {
      console.error("❌ Verification failed:", error.message);
      toast.error(error.message || "Verification failed");
      setVerifying(null);
    }
  };

  const cleanUpOldPendingPayments = async (subscription_id: string) => {
    try {
      const { data, error } = await supabase
        .from("subscription_payments")
        .select("id, created_at")
        .eq("subscription_id", subscription_id)
        .eq("is_verified", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching old payments:", error);
        return;
      }

      if (data && data.length > 1) {
        // Keep only the latest pending payment, delete older ones
        const latestPaymentId = data[0].id;
        const idsToDelete = data.slice(1).map(p => p.id);
        
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("subscription_payments")
            .delete()
            .in("id", idsToDelete);

          if (deleteError) {
            console.error("❌ Error deleting old payments:", deleteError);
          } else {
            console.log(`✅ Deleted ${idsToDelete.length} old payments`);
          }
        }
      }
    } catch (err: any) {
      console.error("❌ Exception in cleanup:", err);
    }
  };

  const handleRefresh = async () => {
    toast.info("Refreshing dashboard...");
    await Promise.all([fetchPendingPayments(), fetchDashboardStats()]);
    toast.success("Dashboard refreshed!");
  };

  const handleViewAllPayments = () => {
    navigate('/admin/payments');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage subscription payments and monitor platform activity
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("is_admin");
                  localStorage.removeItem("user_email");
                  navigate("/", { replace: true });
                }}
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Payments</p>
                    <p className="text-3xl font-bold">{stats.totalPendingPayments}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.todayPending} new today
                    </p>
                  </div>
                  <div className="p-3 bg-warning/10 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                    <p className="text-3xl font-bold">{stats.totalSubscriptions}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.recentVerified} verified this week
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold">₹{stats.totalRevenue}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From verified payments
                    </p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-full">
                    <IndianRupee className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-3xl font-bold">{stats.activeUsers}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      With verified subscriptions
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Listed on platform
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <Package className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Admin</p>
                    <p className="text-lg font-medium truncate">{adminEmail}</p>
                    <p className="text-xs text-success mt-1">
                      ✅ Authenticated
                    </p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-full">
                    <User className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending Payments Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Subscription Payments</CardTitle>
                <CardDescription>
                  Review payment screenshots and verify subscriptions to activate them.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {pendingPayments.length} waiting
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading pending payments...</p>
                </div>
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground mb-4">No pending payments to verify</p>
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check for new payments
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingPayments.slice(0, 4).map((payment) => (
                    <Card key={payment.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Screenshot */}
                          <div className="flex-shrink-0">
                            <div 
                              className="w-40 h-40 border rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(payment.payment_screenshot_url, '_blank')}
                            >
                              <img
                                src={payment.payment_screenshot_url}
                                alt="Payment Screenshot"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  console.log("⚠️ Image failed to load for payment:", payment.id);
                                  e.currentTarget.src = '/screenshot-not-found.svg';
                                }}
                              />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-4">
                              <h3 className="font-semibold text-lg mb-1">
                                {payment.subscription?.plan?.name || "Unknown Plan"}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  <IndianRupee className="w-3 h-3 mr-1" />
                                  {payment.amount_inr}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {payment.subscription?.plan?.listing_count || 0} listings
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{payment.user_profile?.full_name || 'Unknown User'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{new Date(payment.created_at).toLocaleString()}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                User ID: <code className="bg-muted px-1 py-0.5 rounded">{payment.user_id.slice(0, 8)}...</code>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleVerify(payment)}
                              disabled={verifying === payment.id}
                              className="w-full"
                              size="sm"
                            >
                              {verifying === payment.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Verify & Activate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {pendingPayments.length > 4 && (
                  <div className="text-center pt-4 border-t">
                    <p className="text-muted-foreground mb-3">
                      Showing 4 of {pendingPayments.length} pending payments
                    </p>
                    <Button variant="outline" onClick={handleViewAllPayments}>
                      View All Payments
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity & Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleViewAllPayments}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage All Payments
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/users')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/products')}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Product Moderation
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Instructions</CardTitle>
              <CardDescription>How to process payments correctly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Check Payment Screenshot</p>
                    <p className="text-muted-foreground">Verify the screenshot matches transactions in the admin account.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Verify Subscription Details</p>
                    <p className="text-muted-foreground">Confirm the plan and amount match what was purchased.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Activate Subscription</p>
                    <p className="text-muted-foreground">Click "Verify & Activate" to grant listing access to the user.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Monitor Activity</p>
                    <p className="text-muted-foreground">Use the dashboard stats to track platform growth and revenue.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 pt-8 border-t">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              Last updated: {new Date().toLocaleTimeString()} • Auto-refresh every 30 seconds
            </p>
            <p>
              Need help? Check the admin documentation or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;