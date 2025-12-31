import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Laptop, Armchair, ShoppingBag, Shield, MessageCircle, Zap } from 'lucide-react';

const Index = () => {
  const categories = [
    { name: 'Books', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
    { name: 'Electronics', icon: Laptop, color: 'bg-purple-100 text-purple-600' },
    { name: 'Furniture', icon: Armchair, color: 'bg-amber-100 text-amber-600' },
    { name: 'More', icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-600' },
  ];

  const features = [
    { icon: Shield, title: 'Verified Students', description: 'Only college email verified users can buy & sell' },
    { icon: MessageCircle, title: 'Real-time Chat', description: 'Chat directly with buyers and sellers instantly' },
    { icon: Zap, title: 'Easy Listings', description: 'First listing free, affordable subscription plans' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">SwapNest</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/browse">
              <Button variant="ghost">Browse</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="default">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>India's Student Marketplace</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
            Buy & Sell with
            <span className="text-gradient-primary"> Fellow Students</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
            SwapNest connects college students to buy and sell used books, electronics, furniture and more. 
            Safe, verified, and affordable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Start Selling Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Browse Products
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">First listing is absolutely free!</p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {categories.map((cat) => (
              <Link 
                key={cat.name} 
                to={`/browse?category=${cat.name.toLowerCase()}`}
                className="group p-6 bg-card rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <div className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-8 h-8" />
                </div>
                <span className="font-semibold text-foreground">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-4">Why SwapNest?</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Built specifically for Indian college students
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-dark rounded-3xl p-12 text-primary-foreground">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to declutter?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of students already buying and selling on SwapNest
            </p>
            <Link to="/auth?mode=signup">
              <Button variant="accent" size="xl">
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-display font-bold">SwapNest</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 SwapNest. Made for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
