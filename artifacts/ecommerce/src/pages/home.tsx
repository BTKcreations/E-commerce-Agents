import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Sparkles, Zap, ShieldCheck, Clock } from "lucide-react";
import { useGetRecommendations, useListProducts } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Layout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { motion } from "framer-motion";

export function Home() {
  const sessionId = getSessionId();
  const [recommendations, setRecommendations] = useState<any>(null);
  
  const { mutate: getRecs } = useGetRecommendations();
  const { data: popularProducts, isLoading } = useListProducts({ sortBy: "rating" });

  useEffect(() => {
    getRecs(
      { data: { sessionId } },
      {
        onSuccess: (data) => setRecommendations(data)
      }
    );
  }, [sessionId, getRecs]);

  const features = [
    { icon: <Zap className="w-6 h-6 text-accent" />, title: "Dynamic Pricing", desc: "AI adjusts prices in real-time based on market demand." },
    { icon: <Sparkles className="w-6 h-6 text-primary" />, title: "Negotiation AI", desc: "Haggle with our smart agents to get the best deal." },
    { icon: <ShieldCheck className="w-6 h-6 text-green-500" />, title: "Smart Q&A", desc: "Ask complex product questions and get instant verified answers." },
    { icon: <Clock className="w-6 h-6 text-blue-500" />, title: "Predictive Stock", desc: "Our forecasting ensures your favorite items are never out of stock." },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-[2px]" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span>Powered by 5 Autonomous AI Agents</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground mb-6 max-w-4xl mx-auto leading-tight">
              The Future of <span className="text-gradient-primary">E-Commerce</span> is Here.
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Experience dynamic pricing, AI-driven recommendations, and haggle directly with our negotiation bot.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link 
                href="/products" 
                className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                Shop Collection
              </Link>
              <Link 
                href="/dashboard" 
                className="px-8 py-4 rounded-xl bg-card text-foreground border border-border font-bold text-lg hover:bg-muted hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                View Agent Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Features Strip */}
      <section className="py-16 bg-muted/50 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-4 shadow-sm">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Recommendations */}
      {recommendations && recommendations.products && recommendations.products.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold font-display">Curated For You</h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl bg-primary/5 p-4 rounded-xl border border-primary/10 italic">
              " {recommendations.reasoning} "
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.products.slice(0, 4).map((product: any, i: number) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Products */}
      <section className="py-20 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold font-display mb-2">Trending Now</h2>
              <p className="text-muted-foreground">High demand products identified by our Pricing Agent</p>
            </div>
            <Link href="/products" className="text-primary font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(n => (
                <div key={n} className="h-[400px] bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts?.slice(0, 8).map((product: any, i: number) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
