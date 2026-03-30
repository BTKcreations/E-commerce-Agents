import { Link, useLocation } from "wouter";
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Minus, Plus } from "lucide-react";
import { useGetCart, useRemoveFromCart, useCreateOrder, useUpdateCartItem } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Layout } from "@/components/layout";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function Cart() {
  const sessionId = getSessionId();
  const [, setLocation] = useLocation();
  const { data: cart, isLoading, refetch } = useGetCart({ sessionId });

  const { mutate: remove, isPending: isRemoving } = useRemoveFromCart();
  const { mutate: update, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: createOrder, isPending: isOrdering } = useCreateOrder();
  const { toast } = useToast();

  const handleRemove = (itemId: number) => {
    remove({ itemId, params: { sessionId } }, {
      onSuccess: () => refetch()
    });
  };

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    update({ 
      itemId, 
      data: { sessionId, quantity: newQuantity } 
    }, {
      onSuccess: () => refetch()
    });
  };

  const handleCheckout = () => {
    setLocation("/checkout");
  };


  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Your Cart</h1>
        
        {isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
          </div>
        ) : cart?.items && cart.items.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-12">
            
            <div className="flex-1 space-y-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-6 p-6 bg-card border border-border rounded-3xl shadow-sm items-center">
                  <div className="w-24 h-24 bg-muted rounded-xl overflow-hidden shrink-0">
                    <img 
                      src={item.product?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"} 
                      alt="Product" className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{item.product?.name}</h3>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating}
                        className="p-1 hover:bg-muted rounded-md transition-colors border border-border"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating}
                        className="p-1 hover:bg-muted rounded-md transition-colors border border-border"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {item.negotiatedPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">{formatPrice(item.negotiatedPrice)}</span>
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md font-bold">Negotiated</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold">{formatPrice(item.product?.price || 0)}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    disabled={isRemoving}
                    className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-card border border-border p-8 rounded-3xl shadow-lg sticky top-28">
                <h3 className="font-bold text-2xl mb-6">Summary</h3>
                
                <div className="space-y-4 mb-6 text-lg">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatPrice(cart.total)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-green-500 font-medium">Free</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between font-bold text-2xl text-foreground">
                    <span>Total</span>
                    <span>{formatPrice(cart.total)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={isOrdering}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  {isOrdering ? "Processing..." : "Checkout securely"} 
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  <span>AI Fraud Protection Active</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-32 bg-card rounded-3xl border border-border border-dashed">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Let our AI find the perfect products for you.</p>
            <Link href="/products" className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold">
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
