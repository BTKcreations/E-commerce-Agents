import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, LayoutDashboard, Search, Sparkles, Menu, X, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetCart } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const sessionId = getSessionId();
  const { data: cart } = useGetCart({ sessionId }, { 
    query: { retry: false, refetchInterval: 5000 } 
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/orders", label: "Orders" },
    { href: "/dashboard", label: "AI Dashboard", icon: <Sparkles className="w-4 h-4 text-accent" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header 
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300",
          isScrolled ? "glass-card py-3" : "bg-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              ShopSmart <span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 font-medium transition-colors hover:text-primary",
                  location === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cart && cart.itemCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-background"
                >
                  {cart.itemCount}
                </motion.span>
              )}
            </Link>
            
            <button 
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[70px] left-0 w-full bg-background border-b border-border z-40 md:hidden p-4 shadow-xl"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 font-medium p-3 rounded-lg",
                    location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-24 pb-12">
        {children}
      </main>

      <footer className="bg-card border-t border-border/50 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-xl">ShopSmart AI</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              The next generation of e-commerce. Powered by multiple AI agents that negotiate, recommend, and assist you in real-time.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary">Shop All</Link></li>
              <li><Link href="/orders" className="hover:text-primary">My Orders</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary">AI Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-primary">Chat with AI Support</Link></li>
              <li>Returns & Refunds</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
