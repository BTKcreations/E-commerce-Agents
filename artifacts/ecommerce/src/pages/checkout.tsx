import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useGetCart, useCreateOrder } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Layout } from "@/components/layout";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  CreditCard, 
  ChevronRight, 
  CheckCircle2, 
  Truck, 
  Package, 
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  Banknote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Step = "shipping" | "payment" | "review";

export function CheckoutPage() {
  const [step, setStep] = useState<Step>("shipping");
  const { user, isLoading: authLoading } = useAuth();
  const sessionId = getSessionId();
  const { data: cart } = useGetCart({ sessionId });
  const { mutate: createOrder, isPending: isOrdering } = useCreateOrder();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    address: "",
    city: "",
    zip: "",
    phone: ""
  });

  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "cod">("card");

  useEffect(() => {
    if (!authLoading && !user) {
      toast({ title: "Authentication Required", description: "You must log in to access checkout." });
      setLocation("/login");
    }
  }, [user, authLoading, setLocation, toast]);

  const subtotal = cart?.total || 0;
  const shipping = 0;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = () => {
    createOrder({
      data: { 
        sessionId, 
        userId: user?.id,
        shippingAddress: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.zip}`,
        paymentMethod
      }
    }, {
      onSuccess: (data) => {
        toast({
          title: "Order Placed!",
          description: "Moving to order summary...",
        });
        setLocation(`/order-success/${data.id}`);
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Order failed",
          description: err.response?.data?.error || "Could not process order",
        });
      }
    });
  };

  const steps = [
    { id: "shipping", name: "Shipping", icon: Truck },
    { id: "payment", name: "Payment", icon: CreditCard },
    { id: "review", name: "Review", icon: Package },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isPast = steps.findIndex(x => x.id === step) > i;
              
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
                    isActive ? "bg-primary text-white scale-110 shadow-xl shadow-primary/30" : 
                    isPast ? "bg-green-500 text-white" : "bg-card border border-border text-muted-foreground"
                  )}>
                    {isPast ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {step === "shipping" && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card border border-border p-8 rounded-[2rem] shadow-sm space-y-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="text-primary w-6 h-6" />
                    <h2 className="text-2xl font-bold">Shipping Details</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Full Name</label>
                      <input 
                        className="w-full bg-muted/50 border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={shippingInfo.name}
                        onChange={e => setShippingInfo({...shippingInfo, name: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Email</label>
                      <input 
                        className="w-full bg-muted/50 border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={shippingInfo.email}
                        onChange={e => setShippingInfo({...shippingInfo, email: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold ml-1">Street Address</label>
                      <input 
                        className="w-full bg-muted/50 border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={shippingInfo.address}
                        onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})}
                        placeholder="123 Tech Park"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">City</label>
                      <input 
                        className="w-full bg-muted/50 border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={shippingInfo.city}
                        onChange={e => setShippingInfo({...shippingInfo, city: e.target.value})}
                        placeholder="Bangalore"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Zip Code</label>
                      <input 
                        className="w-full bg-muted/50 border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={shippingInfo.zip}
                        onChange={e => setShippingInfo({...shippingInfo, zip: e.target.value})}
                        placeholder="560001"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => setStep("payment")}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group"
                  >
                    Continue to Payment
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card border border-border p-8 rounded-[2rem] shadow-sm space-y-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="text-primary w-6 h-6" />
                    <h2 className="text-2xl font-bold">Payment Method</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => setPaymentMethod("card")}
                      className={cn(
                        "flex items-center gap-6 p-6 rounded-2xl border transition-all text-left",
                        paymentMethod === "card" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shadow-sm">
                        <CreditCard className="text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Credit / Debit Card</p>
                        <p className="text-xs text-muted-foreground">Secure payment via Stripe</p>
                      </div>
                      {paymentMethod === "card" && <CheckCircle2 className="text-primary w-6 h-6" />}
                    </button>

                    <button 
                      onClick={() => setPaymentMethod("upi")}
                      className={cn(
                        "flex items-center gap-6 p-6 rounded-2xl border transition-all text-left",
                        paymentMethod === "upi" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shadow-sm">
                        <Smartphone className="text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">UPI Payment</p>
                        <p className="text-xs text-muted-foreground">Instant bank transfer via PhonePe/GPay</p>
                      </div>
                      {paymentMethod === "upi" && <CheckCircle2 className="text-primary w-6 h-6" />}
                    </button>

                    <button 
                      onClick={() => setPaymentMethod("cod")}
                      className={cn(
                        "flex items-center gap-6 p-6 rounded-2xl border transition-all text-left",
                        paymentMethod === "cod" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shadow-sm">
                        <Banknote className="text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Cash on Delivery</p>
                        <p className="text-xs text-muted-foreground">Pay when your items arrive</p>
                      </div>
                      {paymentMethod === "cod" && <CheckCircle2 className="text-primary w-6 h-6" />}
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep("shipping")}
                      className="px-6 py-4 bg-muted hover:bg-muted/80 rounded-2xl font-bold transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button 
                      onClick={() => setStep("review")}
                      className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group"
                    >
                      Review Order
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "review" && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card border border-border p-8 rounded-[2rem] shadow-sm space-y-8"
                >
                   <div className="flex items-center gap-3 mb-4">
                    <Package className="text-primary w-6 h-6" />
                    <h2 className="text-2xl font-bold">Review Order</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-6 bg-muted/30 rounded-2xl border border-border/50">
                        <h4 className="text-xs font-black uppercase text-muted-foreground mb-4">Shipping To</h4>
                        <p className="font-bold">{shippingInfo.name}</p>
                        <p className="text-sm text-muted-foreground">{shippingInfo.address}</p>
                        <p className="text-sm text-muted-foreground">{shippingInfo.city}, {shippingInfo.zip}</p>
                        <p className="text-sm text-muted-foreground">{shippingInfo.email}</p>
                     </div>
                     <div className="p-6 bg-muted/30 rounded-2xl border border-border/50">
                        <h4 className="text-xs font-black uppercase text-muted-foreground mb-4">Payment Method</h4>
                        <p className="font-bold capitalize">{paymentMethod}</p>
                        <p className="text-sm text-muted-foreground">Secure transaction enabled</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-muted-foreground">Order Items</h4>
                    {cart?.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden shrink-0">
                              <img src={item.product?.imageUrl} className="w-full h-full object-cover" />
                           </div>
                           <span className="text-sm font-medium">{item.product?.name} x {item.quantity}</span>
                        </div>
                        <span className="font-bold text-sm">
                          {formatPrice((item.negotiatedPrice || item.product?.price || 0) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep("payment")}
                      className="px-6 py-4 bg-muted hover:bg-muted/80 rounded-2xl font-bold transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button 
                      onClick={handlePlaceOrder}
                      disabled={isOrdering}
                      className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50"
                    >
                      {isOrdering ? "Placing Order..." : (
                        <>
                          Confirm & Pay {formatPrice(total)}
                          <CheckCircle2 className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
              <h3 className="font-bold text-xl mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-500 font-bold uppercase tracking-wider text-[10px]">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (GST 5%)</span>
                  <span className="font-bold">{formatPrice(tax)}</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-end">
                  <span className="text-lg font-black uppercase">Total</span>
                  <span className="text-2xl font-black text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl flex gap-3">
                 <ShieldCheck className="w-10 h-10 text-primary opacity-50 shrink-0" />
                 <p className="text-[10px] text-muted-foreground leading-tight">
                   Your payment is encrypted and processed through our AI-secure gateway provided by ShopSmart Payments.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
