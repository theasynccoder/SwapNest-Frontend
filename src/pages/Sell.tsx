import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Calculator,
  Plus,
  Trash2
} from 'lucide-react';
import { Category } from '@/lib/types';

const Sell = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listingsRemaining, setListingsRemaining] = useState(0);
  const [planName, setPlanName] = useState<string>('');
  const [planLimit, setPlanLimit] = useState<number>(0);
  const [activeListings, setActiveListings] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    priceInr: '',
    originalPriceInr: '',
    condition: 'good',
    location: '',
    isNegotiable: true,
    calculatorCount: '',
    calculatorType: '',
  });
  const [showCalculatorSection, setShowCalculatorSection] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?mode=signup');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchSubscription();
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const fetchSubscription = async () => {
    if (!user) return;
    // Fetch active subscription with plan info
    const { data: subs } = await supabase
      .from('user_subscriptions')
      .select('listings_remaining, plan:subscription_plans(name, listing_count)')
      .eq('user_id', user.id)
      .eq('payment_verified', true)
      .order('created_at', { ascending: false });
    if (subs && subs.length > 0) {
      const sub = subs[0];
      setListingsRemaining(sub.listings_remaining);
      setPlanName(sub.plan?.name || '');
      setPlanLimit(sub.plan?.listing_count || 0);
    }
    // Fetch user's current active listings
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'active');
    setActiveListings(count || 0);
  };

  const handleImageUpload = async (file: File) => {
    if (images.length >= 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Resize image if too large (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    try {
      // Convert to base64 for now (in production, upload to Supabase Storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImages([...images, base64String]);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to process image');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(handleImageUpload);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(handleImageUpload);
    }
    // Reset input
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, categoryId });
    // Show calculator section if Electronics category is selected
    const category = categories.find(c => c.id === categoryId);
    setShowCalculatorSection(category?.slug === 'electronics');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to create a listing');
      return;
    }
    // Enforce plan-specific listing limit
    if (planLimit > 0 && activeListings >= planLimit) {
      toast.error(`You have reached your plan's limit (${planLimit} listings for ${planName}). Please upgrade your subscription to add more listings.`);
      return;
    }
    if (listingsRemaining <= 0) {
      toast.error('You have no listings remaining. Your subscription is active but you have used all your listings. Please upgrade your subscription to get more listings.');
      return;
    }
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    setLoading(true);
    try {
      // Prepare product data for direct insert
      const { error } = await supabase.from('products').insert([
        {
          seller_id: user.id,
          category_id: formData.categoryId,
          title: formData.title,
          description: formData.description + (formData.calculatorCount && formData.calculatorType
            ? `\n\nCalculator Details:\n- Quantity: ${formData.calculatorCount}\n- Type: ${formData.calculatorType}`
            : ''),
          price_inr: Number(formData.priceInr),
          original_price_inr: formData.originalPriceInr ? Number(formData.originalPriceInr) : null,
          condition: formData.condition,
          images: images,
          location: formData.location || null,
          is_negotiable: formData.isNegotiable,
          status: 'active',
        }
      ]);
      if (error) throw error;

      // Decrement listings_remaining in latest active subscription
      const { data: subs, error: subError } = await supabase
        .from('user_subscriptions')
        .select('id, listings_remaining')
        .eq('user_id', user.id)
        .eq('payment_verified', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (subError) throw subError;
      if (subs && subs.id && typeof subs.listings_remaining === 'number' && subs.listings_remaining > 0) {
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({ listings_remaining: subs.listings_remaining - 1 })
          .eq('id', subs.id);
        if (updateError) throw updateError;
      }

      toast.success('Listing created successfully! Redirecting to dashboard...');
      // Optionally, reset form
      setFormData({
        title: '',
        description: '',
        categoryId: '',
        priceInr: '',
        originalPriceInr: '',
        condition: 'good',
        location: '',
        isNegotiable: true,
        calculatorCount: '',
        calculatorType: '',
      });
      setImages([]);
      setShowCalculatorSection(false);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
              <span className="text-xl font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">SwapNest</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-2">Create New Listing</h1>
          <p className="text-muted-foreground">
            Plan: <span className="font-semibold text-primary">{planName || 'N/A'}</span> | Allowed listings: <span className="font-semibold text-primary">{planLimit}</span> | Your active listings: <span className="font-semibold text-primary">{activeListings}</span>
          </p>
          <p className="text-muted-foreground">
            Listings remaining: <span className="font-semibold text-primary">{listingsRemaining}</span>
          </p>
        </div>

        {listingsRemaining <= 0 && (
          <Card className="p-4 mb-6 bg-warning/10 border-warning">
            <p className="text-warning font-medium mb-2">No listings remaining</p>
            <p className="text-sm text-muted-foreground mb-2">
              Your subscription is active but you have used all your available listings.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade your subscription to get more listings (100 INR = 3 listings, 300 INR = 10 listings).
            </p>
            <Link to="/subscription">
              <Button variant="outline">View Subscription Plans</Button>
            </Link>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <Card className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Product Images</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Add up to 10 images. You can upload from gallery, camera, or drive.
            </p>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 10}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Gallery
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={images.length >= 10}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 10}
              >
                <Upload className="w-4 h-4 mr-2" />
                Drive/Files
              </Button>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="p-6 space-y-4">
            <Label className="text-lg font-semibold block">Basic Information</Label>
            
            <div>
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Used Engineering Books"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.categoryId} onValueChange={handleCategoryChange} required disabled={categories.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={categories.length === 0 ? "No categories available" : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="p-2 text-muted-foreground text-center text-sm">No categories found. Please try again later.</div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product in detail..."
                rows={5}
                required
              />
            </div>

            {/* Calculator Section (for Electronics category) */}
            {showCalculatorSection && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Calculator Details</Label>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="calculatorCount">Number of Calculators</Label>
                    <Input
                      id="calculatorCount"
                      type="number"
                      min="1"
                      value={formData.calculatorCount}
                      onChange={(e) => setFormData({ ...formData, calculatorCount: e.target.value })}
                      placeholder="e.g., 2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calculatorType">Calculator Type</Label>
                    <Input
                      id="calculatorType"
                      value={formData.calculatorType}
                      onChange={(e) => setFormData({ ...formData, calculatorType: e.target.value })}
                      placeholder="e.g., Scientific, Graphing, Basic"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Delhi, Mumbai"
                />
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-6 space-y-4">
            <Label className="text-lg font-semibold block">Pricing</Label>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceInr">Selling Price (₹) *</Label>
                <Input
                  id="priceInr"
                  type="number"
                  min="1"
                  value={formData.priceInr}
                  onChange={(e) => setFormData({ ...formData, priceInr: e.target.value })}
                  placeholder="1000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="originalPriceInr">Original Price (₹)</Label>
                <Input
                  id="originalPriceInr"
                  type="number"
                  min="1"
                  value={formData.originalPriceInr}
                  onChange={(e) => setFormData({ ...formData, originalPriceInr: e.target.value })}
                  placeholder="2000 (optional)"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isNegotiable"
                checked={formData.isNegotiable}
                onChange={(e) => setFormData({ ...formData, isNegotiable: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="isNegotiable" className="cursor-pointer">
                Price is negotiable
              </Label>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="flex-1"
              disabled={loading || listingsRemaining <= 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Listing...
                </>
              ) : (
                'Create Listing'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sell;




