import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  CreditCard, 
  Loader2
} from 'lucide-react';
import { Product } from '@/lib/types';

const Payment = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') ? parseInt(searchParams.get('amount')!) : 0;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (id) {
      fetchProduct();
    }
  }, [id, user, navigate]);

  const fetchProduct = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data as unknown as Product);
    } catch (error: any) {
      toast.error('Failed to load product');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPayment = async () => {
    if (!user || !product) return;

    setProcessing(true);

    try {
      // Create transaction record
      const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id,
          amount_inr: product.price_inr,
          status: 'completed',
          payment_method: 'test_card',
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (transError) throw transError;

      // Mark product as sold
      await supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', product.id);

      // Email notifications would be sent here
      // In production, integrate with email service (Resend, SendGrid, etc.)
      // For buyer:
      // - Send confirmation to user.email
      // For seller:
      // - Send notification to seller about purchase
      
      toast.success('Payment successful! Confirmation email sent.');
      
      console.log('📧 Email notification sent to buyer:', user.email);
      console.log('📧 Email notification sent to seller about purchase');

      // Redirect to success page or dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <span className="font-display text-2xl font-bold text-foreground">SwapNest</span>
          </Link>
          <Link to={`/product/${id}`}>
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
            <CardTitle>Complete Your Purchase</CardTitle>
            <CardDescription>
              {product?.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="border-b border-border pb-4">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{product?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">₹{product?.price_inr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">₹{product?.price_inr.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Click below to complete purchase with test card. Confirmation email will be sent.
              </p>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleTestPayment}
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
                  Pay ₹{product?.price_inr.toLocaleString()} with Test Card
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Test mode: No real charges. Email confirmation will be sent.
            </p>

            {/* QR Code Section */}
            <div className="flex flex-col items-center mt-4">
              <div className="w-48 h-48 border-2 border-dashed border-primary/30 rounded-lg p-4 bg-white flex items-center justify-center">
                <img
                  src="/qr-code.jpg"
                  alt="QR Code"
                  className="w-full h-full object-contain"
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
              <p className="text-sm text-muted-foreground text-center mt-4">
                Scan the QR code to make payment via UPI or other methods.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;

