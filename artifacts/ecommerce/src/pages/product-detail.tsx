import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { ShoppingCart, Handshake, Star, ShieldCheck, TrendingDown, Send, Sparkles, AlertTriangle, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { useGetProduct, useGetPricingForecast, useAddToCart, useAskProductQuestion, useGetProductReviews, useAddProductReview, useGetCart } from "@workspace/api-client-react";
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

  const { data: product, isLoading: isProdLoading, refetch: refetchProduct } = useGetProduct(productId);
  const { data: forecast } = useGetPricingForecast({ productId });
  const { data: reviews, refetch: refetchReviews } = useGetProductReviews(productId);
  const { data: cart } = useGetCart({ sessionId });
  
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");

  const { mutate: addReview, isPending: isSubmittingReview } = useAddProductReview();
  
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();
  const { mutate: askQa, isPending: isAsking } = useAskProductQuestion();

  const isInCart = cart?.items.some(item => item.productId === productId);

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

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor || !reviewBody) return;

    addReview({
      id: productId,
      data: {
        author: reviewAuthor,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody
      }
    }, {
      onSuccess: () => {
        toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
        setReviewAuthor("");
        setReviewTitle("");
        setReviewBody("");
        setReviewRating(5);
        refetchReviews();
        refetchProduct();
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

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button 
                  onClick={() => handleAddToCart()}
                  disabled={isAdding}
                  className="flex-1 px-6 py-4 bg-foreground text-background font-bold text-lg rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isAdding ? "Adding..." : isInCart ? "In Cart" : "Add to Cart"}
                </button>
                
                <button 
                  onClick={() => setIsNegOpen(true)}
                  disabled={isInCart}
                  className={cn(
                    "flex-1 px-6 py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 border-0",
                    isInCart 
                      ? "bg-green-100 text-green-700 cursor-not-allowed border-green-200" 
                      : "bg-gradient-to-r from-primary to-accent text-white hover:shadow-xl hover:shadow-primary/30"
                  )}
                >
                  {isInCart ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      In Cart
                    </>
                  ) : (
                    <>
                      <Handshake className="w-5 h-5" />
                      Message Manager
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic AI Forecasting Info */}
              {forecast && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-accent/5 border border-accent/20 rounded-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-12 h-12 text-accent" />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                    <h4 className="font-bold text-accent tracking-tight italic">AI Market Analysis</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Market Demand</p>
                      <p className={cn(
                        "text-xl font-display font-black uppercase",
                        forecast.demandLevel === 'surge' ? "text-destructive" : "text-primary"
                      )}>{forecast.demandLevel}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Price Health</p>
                      <p className="text-xl font-display font-black text-foreground">
                        {forecast.demandLevel === 'surge' ? "Optimized" : "Competitive"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-border/50 relative z-10">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "{forecast.forecast}"
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-8">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <h4 className="font-bold">Verified Authentic</h4>
                  <p className="text-sm text-muted-foreground">Quality checked before shipping</p>
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
                <p className="text-sm text-muted-foreground">Ask about this product</p>
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
                    <Sparkles className="w-4 h-4 text-primary" /> Typing...
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display font-bold">Customer Reviews</h3>
            </div>

            {/* Write a Review Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 p-8 glass-card border border-border/50 rounded-3xl shadow-xl shadow-black/5"
            >
              <h4 className="text-xl font-display font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                Share Your Experience
              </h4>
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground ml-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground ml-1">Rating</label>
                    <div className="flex items-center gap-2 h-12 px-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setReviewRating(star)}
                          className={cn("p-1.5 transition-colors", star <= reviewRating ? "text-amber-500" : "text-muted-foreground/30")}
                        >
                          <Star className={cn("w-7 h-7", star <= reviewRating ? "fill-current" : "")} />
                        </motion.button>
                      ))}
                      <span className="ml-3 font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
                        {reviewRating}/5
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Review Title</label>
                  <input
                    type="text"
                    placeholder="Summarize your thoughts"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Your Review</label>
                  <textarea
                    placeholder="What did you like or dislike?"
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-4 text-base min-h-[120px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-4 bg-foreground text-background font-bold text-lg rounded-2xl hover:bg-foreground/90 disabled:opacity-50 transition-all shadow-lg hover:shadow-black/20 flex items-center justify-center gap-2"
                >
                  {isSubmittingReview ? "Submitting..." : (
                    <>
                      <Send className="w-5 h-5" />
                      Post Review
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {reviews && reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((rev, idx) => (
                  <motion.div 
                    key={rev.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-8 bg-card border border-border/60 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                    
                    <div className="flex items-start justify-between mb-6 relative">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
                          {rev.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-bold text-lg text-foreground">{rev.author}</span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 bg-amber-50 p-2 rounded-xl border border-amber-100/50">
                        {Array.from({length: 5}).map((_, i) => (
                          <Star key={i} className={cn("w-4 h-4", i < rev.rating ? "text-amber-500 fill-current" : "text-amber-200")} />
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative">
                      {rev.title && <h5 className="text-xl font-bold mb-3 text-foreground tracking-tight">{rev.title}</h5>}
                      <p className="text-muted-foreground leading-relaxed text-lg">
                        {rev.body}
                      </p>
                    </div>
                    
                    <div className="mt-6 flex items-center gap-4 pt-6 border-t border-border/50">
                      <button className="text-sm font-semibold text-primary hover:underline">Helpful?</button>
                      <button className="text-sm font-semibold text-muted-foreground hover:underline">Report</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-16 border-2 border-dashed border-border/50 rounded-[2.5rem] text-center bg-muted/5 group"
              >
                <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                  Be the first to share your thoughts about this product and help others make a better choice.
                </p>
                <button 
                  onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                  Write the First Review
                </button>
              </motion.div>
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
