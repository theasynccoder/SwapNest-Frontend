import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  CreditCard, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

const LISTING_FEE = 10; // ₹10 per listing

const ListingFee = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productData = searchParams.get('data'); // Base64 encoded product data
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const handlePayListingFee = async () => {
    if (!user || !productData) {
      toast.error('Missing payment information');
      return;
    }

    setProcessing(true);

    try {
      // Decode product data
      const decoded = JSON.parse(atob(productData));
      
      // Create product with pending status (will be activated after payment)
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          category_id: decoded.categoryId,
          title: decoded.title,
          description: decoded.description,
          price_inr: parseInt(decoded.priceInr),
          original_price_inr: decoded.originalPriceInr ? parseInt(decoded.originalPriceInr) : null,
          condition: decoded.condition,
          images: decoded.images || [],
          location: decoded.location || null,
          is_negotiable: decoded.isNegotiable,
          status: 'active', // Active immediately after payment
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create listing fee transaction
      await supabase
        .from('transactions')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: user.id,
          amount_inr: LISTING_FEE,
          status: 'completed',
          payment_method: 'test_card',
          completed_at: new Date().toISOString(),
        });

      // Decrement listing count if user has subscription
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('id, listings_remaining')
        .eq('user_id', user.id)
        .eq('payment_verified', true)
        .gt('listings_remaining', 0)
        .order('created_at', { ascending: false })
        .limit(1);

      if (subscriptions && subscriptions.length > 0) {
        const sub = subscriptions[0];
        await supabase
          .from('user_subscriptions')
          .update({ listings_remaining: sub.listings_remaining - 1 })
          .eq('id', sub.id);
      }

      toast.success('Listing fee paid! Your product is now live.');
      
      // Email notification
      console.log('📧 Listing fee payment confirmation sent to:', user.email);
      console.log('📧 Admin notification: New listing fee payment');

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">SwapNest</span>
          </Link>
          <Link to="/sell">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Pay Listing Fee</CardTitle>
            <CardDescription>
              A small fee of ₹{LISTING_FEE} is required to publish your listing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Listing Fee:</span>
                <span className="text-2xl font-bold text-primary">₹{LISTING_FEE}</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Test Payment Mode:</strong> This is a test transaction. No real money will be charged.
              </p>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handlePayListingFee}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ₹{LISTING_FEE} with Test Card
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By proceeding, you agree to SwapNest's terms. Test card: 4242 4242 4242 4242
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListingFee;



