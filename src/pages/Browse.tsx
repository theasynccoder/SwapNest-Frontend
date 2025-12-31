import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Heart, MapPin, ArrowLeft } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface Product {
  id: string;
  title: string;
  price_inr: number;
  original_price_inr: number | null;
  images: string[];
  location: string | null;
  condition: string;
  created_at: string;
  category: Category;
}

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const selectedCategory = searchParams.get('category') || '';

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [searchParams]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('id, title, price_inr, original_price_inr, images, location, condition, created_at, category:categories(id, name, slug, icon)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const categorySlug = searchParams.get('category');
    if (categorySlug) {
      const cat = categories.find(c => c.slug === categorySlug);
      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }

    const q = searchParams.get('q');
    if (q) {
      query = query.ilike('title', `%${q}%`);
    }

    const { data } = await query;
    if (data) setProducts(data as unknown as Product[]);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug === selectedCategory) {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    setSearchParams(params);
  };

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
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="font-display text-3xl font-bold mb-4">Browse Products</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for books, electronics, furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-5 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">No products found</p>
            <Button variant="outline" onClick={() => setSearchParams({})}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="group bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <button className="absolute top-2 right-2 w-8 h-8 bg-card/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-card transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                  {product.original_price_inr && product.original_price_inr > product.price_inr && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded">
                      {Math.round((1 - product.price_inr / product.original_price_inr) * 100)}% OFF
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-foreground line-clamp-1 mb-1">{product.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">₹{product.price_inr.toLocaleString()}</span>
                    {product.original_price_inr && product.original_price_inr > product.price_inr && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{product.original_price_inr.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {product.location && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {product.location}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
