import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MessageCircle, 
  MapPin, 
  Package,
  Loader2,
  Heart,
  IndianRupee,
  Tag
} from 'lucide-react';
import { Product, Profile } from '@/lib/types';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Fetch product with category
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug, icon)
        `)
        .eq('id', id)
        .single();

      if (productError) throw productError;
      if (!productData) {
        toast.error('Product not found');
        navigate('/browse');
        return;
      }

      setProduct(productData as unknown as Product);

      // Increment view count
      try {
        await supabase
          .from('products')
          .update({ views: (productData.views || 0) + 1 })
          .eq('id', id);
      } catch (error) {
        // Ignore view count errors
      }

      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', productData.seller_id)
        .single();

      if (sellerData) {
        setSeller(sellerData as unknown as Profile);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load product');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      toast.error('Please sign in to contact seller');
      navigate('/auth');
      return;
    }

    if (!product) return;

    if (user.id === product.seller_id) {
      toast.error('You cannot contact yourself');
      return;
    }

    setContacting(true);

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('product_id', product.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', product.seller_id)
        .single();

      if (existingConv) {
        // Navigate to existing conversation
        navigate(`/messages/${existingConv.id}`);
        return;
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Navigate to conversation
      navigate(`/messages/${newConv.id}`);
      toast.success('Conversation started!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start conversation');
    } finally {
      setContacting(false);
    }
  };

  const handleMakeOffer = () => {
    // For now, redirect to contact seller (can be expanded later)
    handleContactSeller();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Link to="/browse">
            <Button>Back to Browse</Button>
          </Link>
        </div>
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
              <span className="text-xl font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">SwapNest</span>
          </Link>
          <Link to="/browse">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-xl overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((img, index) => (
                  <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img src={img} alt={`${product.title} ${index + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                  {product.category?.name || 'Uncategorized'}
                </span>
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded capitalize">
                  {product.condition}
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold mb-4">{product.title}</h1>
              
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-bold text-primary">₹{product.price_inr.toLocaleString()}</span>
                {product.original_price_inr && product.original_price_inr > product.price_inr && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.original_price_inr.toLocaleString()}
                    </span>
                    <span className="px-2 py-1 bg-destructive/10 text-destructive text-sm font-medium rounded">
                      {Math.round((1 - product.price_inr / product.original_price_inr) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              {product.location && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{product.location}</span>
                </div>
              )}
            </div>

            {/* Contact Seller Section */}
            {user?.id !== product.seller_id && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Contact Seller</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <span className="font-medium">{seller?.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <a 
                        href={`mailto:${seller?.college_email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {seller?.college_email || 'N/A'}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      {seller?.phone ? (
                        <a 
                          href={`tel:${seller.phone}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {seller.phone}
                        </a>
                      ) : (
                        <span className="font-medium">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="hero"
                      size="lg"
                      className="flex-1"
                      onClick={handleContactSeller}
                      disabled={contacting}
                    >
                      {contacting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {!user && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  Sign in to contact the seller or make an offer
                </p>
                <Link to="/auth">
                  <Button variant="hero" className="w-full">Sign In</Button>
                </Link>
              </div>
            )}


            {/* Description */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            </Card>

            {/* Product Details */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condition:</span>
                  <span className="font-medium capitalize">{product.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Negotiable:</span>
                  <span className="font-medium">{product.is_negotiable ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views:</span>
                  <span className="font-medium">{product.views || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listed:</span>
                  <span className="font-medium">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

