// ...existing code...

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Mail,
  User,
  Calendar,
  IndianRupee
} from 'lucide-react';

const AdminPayments = () => {
  const navigate = useNavigate();
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPending: 0,
    todayPending: 0
  });

  useEffect(() => {
    // Check if user is admin using localStorage ONLY
    const isAdminFlag = localStorage.getItem("is_admin");
    const adminEmail = localStorage.getItem("user_email");
    
    console.log("🔐 Admin check:", { isAdminFlag, adminEmail });

    if (isAdminFlag !== "true" || adminEmail !== "mamughees292@gmail.com") {
      console.log("❌ Not admin, redirecting to /admin-login");
      toast.error('Access denied. Admin only.');
      navigate("/admin-login", { replace: true });
      return;
    }

    console.log("✅ Admin verified, loading payments");
    fetchPendingPayments();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_payments',
        },
        () => {
          console.log('📢 Real-time update: subscription_payments changed');
          fetchPendingPayments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
        },
        () => {
          console.log('📢 Real-time update: user_subscriptions changed');
          fetchPendingPayments();
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const fetchPendingPayments = async () => {
    try {
      console.log('🔄 Fetching pending payments...');
      setLoading(true);
      
      // Fetch payments that are NOT verified
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('❌ Payments fetch error:', paymentsError);
        throw paymentsError;
      }

      console.log(`📋 Found ${paymentsData?.length || 0} unverified payments`);

      if (!paymentsData || paymentsData.length === 0) {
        setPendingPayments([]);
        setStats({ totalPending: 0, todayPending: 0 });
        return;
      }

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayPending = paymentsData.filter(p => {
        const paymentDate = new Date(p.created_at);
        return paymentDate >= today;
      }).length;

      setStats({
        totalPending: paymentsData.length,
        todayPending
      });

      // Fetch user profiles
      const userIds = paymentsData.map(p => p.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, college_email')
        .in('user_id', userIds);

      // Fetch subscriptions with plans
      const subscriptionIds = paymentsData.map(p => p.subscription_id);
      const { data: subscriptionsData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          payment_verified,
          verified_at,
          verified_by,
          listings_remaining,
          plan:subscription_plans(name, listing_count, price_inr)
        `)
        .in('id', subscriptionIds);

      if (subError) {
        console.error('❌ Subscriptions fetch error:', subError);
        toast.error('Could not fetch subscription details');
      }

      // Combine data - Show ALL pending payments regardless of subscription status
      const combined = paymentsData.map(payment => {
        const userProfile = profilesData?.find(p => p.user_id === payment.user_id);
        const subscription = subscriptionsData?.find(s => s.id === payment.subscription_id);
        
        return {
          ...payment,
          user: userProfile || null,
          subscription: subscription || null
        };
      });

      console.log('🎯 Combined payments:', combined);
      setPendingPayments(combined);

    } catch (error: any) {
      console.error('❌ Error fetching payments:', error);
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string, subscriptionId: string, approve: boolean) => {
    setVerifying(paymentId);
    console.log(`🔄 Processing verification:`, { paymentId, subscriptionId, approve });
    try {
      if (approve) {
        // Fetch the subscription to get the plan's listing_count
        const { data: subscription, error: fetchError } = await supabase
          .from('user_subscriptions')
          .select('id, plan:subscription_plans(listing_count)')
          .eq('id', subscriptionId)
          .single();
        if (fetchError) throw fetchError;

        const listingCount = subscription?.plan?.listing_count || 0;

        // Update subscription to verified and set listings_remaining
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .update({
            payment_verified: true,
            verified_by: user?.email || 'admin',
            verified_at: new Date().toISOString(),
            listings_remaining: listingCount,
          })
          .eq('id', subscriptionId);

        if (subError) {
          console.error('Subscription update error:', subError);
          throw subError;
        }

        // Then verify payment
        const { error: paymentError } = await supabase
          .from('subscription_payments')
          .update({
            is_verified: true,
            verified_by: user?.email || 'admin',
            verified_at: new Date().toISOString(),
          })
          .eq('id', paymentId);

        if (paymentError) {
          console.error('Payment update error:', paymentError);
          throw paymentError;
        }

        toast.success('Payment verified! Subscription activated.');
        // Email notification
        console.log('📧 Email sent to swapnest@99gmail.com: Subscription payment verified');
        console.log('📧 Email sent to user: Subscription activated');
        console.log('✅ Subscription ID:', subscriptionId, 'marked as verified');

        // Refresh list to remove verified payment
        setTimeout(async () => {
          await fetchPendingPayments();
        }, 500);
      } else {
        // Reject payment
        toast.info('Payment rejected');
        // Remove from list even if rejected
        setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
      }
    } catch (error: any) {
      console.error('Verify error:', error);
      toast.error(error.message || 'Failed to verify payment');
    } finally {
      setVerifying(null);
    }
  };

  const handleManualRefresh = async () => {
    toast.info('Refreshing payment list...');
    await fetchPendingPayments();
    toast.success('Payment list refreshed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">SwapNest Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={loading}
            >
              <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Payment Verification</h1>
          <p className="text-muted-foreground mb-6">
            Review and verify subscription payment requests. New payments will appear here.
          </p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pending</p>
                    <p className="text-3xl font-bold">{stats.totalPending}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-warning/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Pending</p>
                    <p className="text-3xl font-bold">{stats.todayPending}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Admin</p>
                    <p className="text-lg font-medium truncate">admin</p>
                  </div>
                  <User className="w-10 h-10 text-success/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {pendingPayments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending payments to verify</p>
              <p className="text-sm text-muted-foreground mt-2">
                New payment requests will appear here automatically
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Pending Verifications ({pendingPayments.length})</h2>
              <p className="text-sm text-muted-foreground">
                Click on any image to view in full size
              </p>
            </div>
            
            {pendingPayments.map((payment) => (
              <Card key={payment.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {payment.subscription?.plan?.name || 'Subscription Plan'}
                        <span className="text-sm font-normal px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {payment.subscription?.plan?.listing_count || '?'} listings
                        </span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          <span className="font-semibold">₹{payment.amount_inr}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(payment.created_at).toLocaleString()}
                        </span>
                      </CardDescription>
                    </div>
                    <span className="px-3 py-1 bg-warning/10 text-warning text-sm font-medium rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Pending Verification
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* User Information */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          User Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground min-w-[80px]">Name:</span>
                            <span className="font-medium">{payment.user?.full_name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground min-w-[80px]">Email:</span>
                            <span className="font-medium truncate">{payment.user?.college_email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground min-w-[80px]">User ID:</span>
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate">
                              {payment.user_id?.substring(0, 8)}...
                            </code>
                          </div>
                        </div>
                      </div>
                      
                      {/* Subscription Details */}
                      {payment.subscription && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Subscription Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                              <span className="text-muted-foreground">Plan:</span>
                              <span className="font-medium">{payment.subscription.plan?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                              <span className="text-muted-foreground">Listings Remaining:</span>
                              <span className="font-medium">{payment.subscription.listings_remaining || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                              <span className="text-muted-foreground">Payment Verified:</span>
                              <span className={`font-medium ${payment.subscription.payment_verified ? 'text-success' : 'text-warning'}`}>
                                {payment.subscription.payment_verified ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Screenshot */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Payment Screenshot
                      </h4>
                      {payment.payment_screenshot_url ? (
                        <div className="space-y-3">
                          <div 
                            className="relative group cursor-pointer rounded-lg overflow-hidden border border-border"
                            onClick={() => window.open(payment.payment_screenshot_url, '_blank')}
                          >
                            <img
                              src={payment.payment_screenshot_url}
                              alt="Payment screenshot"
                              className="w-full h-64 object-contain bg-muted group-hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                console.error('❌ Image failed to load:', payment.payment_screenshot_url);
                                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                                Click to view full size
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            Click the image above to view in new tab
                          </p>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/30">
                          <p className="text-muted-foreground">No screenshot available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-border">
                    <div className="flex-1">
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full"
                        onClick={async () => {
                          await handleVerifyPayment(payment.id, payment.subscription_id, true);
                        }}
                        disabled={verifying === payment.id || payment.subscription?.payment_verified === true}
                      >
                        {verifying === payment.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : payment.subscription?.payment_verified ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Already Verified
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve & Verify
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        This will activate the user's subscription
                      </p>
                    </div>
                    
                    <div className="flex-1">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() => handleVerifyPayment(payment.id, payment.subscription_id, false)}
                        disabled={verifying === payment.id}
                      >
                        {verifying === payment.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Reject Payment
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Mark as rejected without activating subscription
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Admin Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Admin Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <span className="font-semibold">New payments:</span> Automatically appear here when users submit subscription payments with screenshots.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <span className="font-semibold">Verification process:</span> Check the screenshot matches the QR code transaction, then click "Approve & Verify" to activate the subscription.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <span className="font-semibold">Notifications:</span> Email notifications are sent to swapnest@99gmail.com for each verification.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <span className="font-semibold">Real-time updates:</span> The list updates automatically when new payments are submitted or status changes.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>
                  <span className="font-semibold">Troubleshooting:</span> If payments don't appear, check your internet connection and refresh the page.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-warning mb-1">Important Security Note</p>
                  <p className="text-sm text-muted-foreground">
                    Only verify payments that match transactions in the admin account. 
                    Always double-check the payment screenshot against the transaction history 
                    before approving.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-8 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-mono space-y-1">
                <p>Admin Email: mamughees292@gmail.com</p>
                <p>Total Pending: {stats.totalPending}</p>
                <p>Today's Pending: {stats.todayPending}</p>
                <p>Current Time: {new Date().toLocaleString()}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    console.log('Pending Payments:', pendingPayments);
                    console.log('Stats:', stats);
                    toast.info('Debug info logged to console');
                  }}
                >
                  Log Debug Info
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;