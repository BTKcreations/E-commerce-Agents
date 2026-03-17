import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { ShoppingCart, Handshake, Star, ShieldCheck, TrendingDown, Send, Sparkles, AlertTriangle } from "lucide-react";
import { useGetProduct, useGetPricingForecast, useAddToCart, useAskProductQuestion, useGetProductReviews } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Layout } from "@/components/layout";
import { NegotiationDialog } from "@/components/negotiation-dialog";
import { formatPrice, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export function ProductDetail() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const sessionId = getSessionId();
  const { toast } = useToast();

  const [isNegOpen, setIsNegOpen] = useState(false);
  const [qaInput, setQaInput] = useState("");
  const [qaHistory, setQaHistory] = useState<Array<{q: string, a: any}>>([]);

  const { data: product, isLoading: isProdLoading } = useGetProduct(productId);
  const { data: forecast } = useGetPricingForecast({ productId });
  const { data: reviews } = useGetProductReviews(productId);
  
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();
  const { mutate: askQa, isPending: isAsking } = useAskProductQuestion();

  const handleAddToCart = (negotiatedPrice?: number) => {
    addToCart({
      data: {
        sessionId,
        productId,
        quantity: 1,
        negotiatedPrice
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Added to Cart",
          description: `${product?.name} has been added to your cart.`,
        });
      }
    });
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaInput.trim()) return;
    
    const question = qaInput;
    setQaInput("");
    
    askQa({
      data: { productId, question, sessionId }
    }, {
      onSuccess: (data) => {
        setQaHistory(prev => [...prev, { q: question, a: data }]);
      }
    });
  };

  if (isProdLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2 h-[500px] bg-muted rounded-3xl" />
          <div className="w-full md:w-1/2 space-y-6">
            <div className="h-10 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded w-full" />
            <div className="h-16 bg-muted rounded w-1/2" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) return <Layout><div className="p-20 text-center text-2xl font-bold">Product not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-12 mb-20">
          
          {/* Images */}
          <div className="w-full lg:w-1/2">
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden border border-border/50 shadow-sm relative group">
              {/* stock minimalist product elegant */}
              <img 
                src={product.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Dynamic AI Badge */}
              {forecast?.demandLevel === "surge" && (
                <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-border shadow-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs font-bold text-accent uppercase tracking-wider">Dynamic Pricing</p>
                    <p className="text-sm font-medium">Price adjusted for demand</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="mb-2 flex items-center gap-4">
              <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-amber-500 font-medium">
                <Star className="w-4 h-4 fill-current" />
                {product.rating} ({product.reviewCount} reviews)
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
              {product.name}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="mb-10 p-6 bg-card border border-border rounded-2xl shadow-sm">
              <div className="flex items-end gap-4 mb-6">
                <span className="text-5xl font-display font-extrabold text-foreground tracking-tight">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xl text-muted-foreground line-through mb-1">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => handleAddToCart()}
                  disabled={isAdding}
                  className="flex-1 px-6 py-4 bg-foreground text-background font-bold text-lg rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-95"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isAdding ? "Adding..." : "Add to Cart"}
                </button>
                
                <button 
                  onClick={() => setIsNegOpen(true)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95 border-0"
                >
                  <Handshake className="w-5 h-5" />
                  Haggle with AI
                </button>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-8">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <h4 className="font-bold">Verified Authentic</h4>
                  <p className="text-sm text-muted-foreground">Checked by AI before shipping</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 mt-1" />
                <div>
                  <h4 className="font-bold">Stock Status</h4>
                  <p className="text-sm text-muted-foreground">{forecast?.stockStatus || "In Stock"}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* AI Q&A Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Q&A Chat */}
          <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 bg-muted/50 border-b border-border flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-display font-bold text-xl">Product Q&A</h3>
                <p className="text-sm text-muted-foreground">Ask our AI anything about this product</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {qaHistory.length === 0 && (
                <div className="text-center text-muted-foreground mt-20">
                  <p>Common questions:</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {["Is it good for gaming?", "What's the battery life?", "Does it have warranty?"].map(q => (
                      <button key={q} onClick={() => setQaInput(q)} className="px-3 py-1.5 bg-background border border-border rounded-full text-sm hover:border-primary transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {qaHistory.map((item, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                      {item.q}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted px-5 py-4 rounded-2xl rounded-tl-sm max-w-[85%]">
                      <p className="mb-3">{item.a.answer}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        {item.a.pros && item.a.pros.length > 0 && (
                          <div>
                            <h5 className="font-bold text-green-600 mb-1">Pros</h5>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                              {item.a.pros.map((p:string, j:number) => <li key={j}>{p}</li>)}
                            </ul>
                          </div>
                        )}
                        {item.a.cons && item.a.cons.length > 0 && (
                          <div>
                            <h5 className="font-bold text-red-500 mb-1">Cons</h5>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                              {item.a.cons.map((p:string, j:number) => <li key={j}>{p}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex justify-start">
                  <div className="bg-muted px-5 py-4 rounded-2xl rounded-tl-sm animate-pulse flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> AI is typing...
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-background border-t border-border">
              <form onSubmit={handleAskQuestion} className="relative">
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-muted border border-border rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button 
                  type="submit" 
                  disabled={isAsking || !qaInput}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Reviews Summary */}
          <div>
            <h3 className="text-2xl font-display font-bold mb-6">Customer Reviews</h3>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-6 bg-card border border-border rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold">
                          {rev.author.charAt(0)}
                        </div>
                        <span className="font-bold">{rev.author}</span>
                      </div>
                      <div className="flex text-amber-500">
                        {Array.from({length: 5}).map((_, i) => (
                          <Star key={i} className={cn("w-4 h-4", i < rev.rating ? "fill-current" : "text-muted opacity-30")} />
                        ))}
                      </div>
                    </div>
                    <h5 className="font-bold mb-1">{rev.title}</h5>
                    <p className="text-muted-foreground">{rev.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 border border-dashed border-border rounded-3xl text-center text-muted-foreground">
                No reviews yet. Be the first to review!
              </div>
            )}
          </div>
        </div>

      </div>

      <NegotiationDialog 
        isOpen={isNegOpen}
        onClose={() => setIsNegOpen(false)}
        productId={productId}
        productName={product.name}
        originalPrice={product.price}
        sessionId={sessionId}
        onSuccess={handleAddToCart}
      />
    </Layout>
  );
}
