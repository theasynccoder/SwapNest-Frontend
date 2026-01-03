import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import {
  Plus,
  Package,
  MessageCircle,
  Heart,
  Settings,
  LogOut,
  CreditCard,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  full_name: string;
  college_email: string;
  avatar_url: string | null;
}

interface UserSubscription {
  listings_remaining: number;
}

interface Product {
  id: string;
  title: string;
  price_inr: number;
  images: string[];
  status: string;
  views: number;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Product[]>([]);
  const [listingsRemaining, setListingsRemaining] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchListings();
      fetchSubscription();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, college_email, avatar_url")
      .eq("user_id", user?.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchListings = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, title, price_inr, images, status, views, created_at")
      .eq("seller_id", user?.id)
      .order("created_at", { ascending: false });
    if (data) setListings(data);
  };

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select(
        "listings_remaining, payment_verified, plan:subscription_plans(name)"
      )
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    if (data) {
      const verified = data.filter((sub: any) => sub.payment_verified === true);
      const latest = verified[0];
      setListingsRemaining(latest ? latest.listings_remaining : 0);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleDeleteListing = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete || !user) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete)
        .eq("seller_id", user.id); // Ensure user can only delete their own listings

      if (error) throw error;

      toast.success("Listing deleted successfully");
      fetchListings(); // Refresh listings
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete listing");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">
                S
              </span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              SwapNest
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/browse">
              <Button variant="ghost" size="sm">
                Browse
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="ghost" size="icon">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
            {user?.email === "mamughees292@gmail.com" && (
              <Link to="/admin/payments">
                <Button variant="ghost" size="sm">
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Subscription Status */}
        {user && (
          <div className="mb-6">
            <SubscriptionStatus userId={user.id} />
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-gradient-dark rounded-2xl p-8 mb-8 text-primary-foreground">
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-primary-foreground/70">
            Manage your listings and connect with buyers
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{listings.length}</p>
            <p className="text-sm text-muted-foreground">My Listings</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">{listingsRemaining}</p>
            <p className="text-sm text-muted-foreground">Listings Left</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold">
              {listings.reduce((sum, p) => sum + p.views, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Wishlist</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link to="/sell" className="block">
            <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground hover:shadow-glow transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold">
                    Sell Something
                  </h3>
                  <p className="text-primary-foreground/70 text-sm">
                    List your item in minutes
                  </p>
                </div>
              </div>
            </div>
          </Link>
          <Link to="/subscription" className="block">
            <div className="bg-card border-2 border-primary rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold">
                    Get More Listings
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Upgrade your plan today
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* My Listings */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold">My Listings</h2>
            <Link to="/sell">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> New Listing
              </Button>
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't listed anything yet
              </p>
              <Link to="/sell">
                <Button>Create Your First Listing</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {listings.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                >
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{product.title}</h3>
                    <p className="text-primary font-semibold">
                      ₹{product.price_inr.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          product.status === "active"
                            ? "bg-success/10 text-success"
                            : product.status === "sold"
                            ? "bg-muted text-muted-foreground"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {product.status}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.views} views
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteListing(product.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot
              be undone and the listing will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Subscription Status Component
const SubscriptionStatus = ({ userId }: { userId: string }) => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();

    // Real-time subscription updates
    const channel = supabase
      .channel("subscription-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Subscription status update:", payload);
          fetchSubscriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*, plan:subscription_plans(name, listing_count)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
    }

    if (data) {
      console.log("Fetched subscriptions:", data);
      console.log(
        "Payment verified values:",
        data.map((s) => ({
          id: s.id,
          verified: s.payment_verified,
          type: typeof s.payment_verified,
        }))
      );
      setSubscriptions(data);
    }
    setLoading(false);
  };

  const verifiedSubscriptions = subscriptions.filter(
    (s) => s.payment_verified === true || s.payment_verified === "true"
  );
  const pendingSubscriptions = subscriptions.filter(
    (s) => s.payment_verified !== true && s.payment_verified !== "true"
  );

  if (loading || subscriptions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
      </CardHeader>
      <CardContent>
        {verifiedSubscriptions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="font-semibold">
                Your Subscription Verified and Activated
              </span>
            </div>
            <div className="space-y-2">
              {/* Show only the latest verified subscription */}
              <div
                key={verifiedSubscriptions[0].id}
                className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20"
              >
                <div>
                  <p className="font-medium text-success">
                    {verifiedSubscriptions[0].plan?.name || "Subscription"} - Active
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {verifiedSubscriptions[0].listings_remaining} listings remaining
                  </p>
                  <p className="text-xs text-success mt-1 font-medium">
                    ✓ Your subscription is active
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>
        )}
        {pendingSubscriptions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-warning" />
              <span className="font-semibold">Pending Verification</span>
            </div>
            <div className="space-y-2">
              {pendingSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-warning/10 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {sub.plan?.name || "Subscription"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Awaiting admin verification
                    </p>
                  </div>
                  <Clock className="w-5 h-5 text-warning" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard;
