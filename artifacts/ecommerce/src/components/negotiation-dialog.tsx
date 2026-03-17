import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, X, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useStartNegotiation, useMakeOffer } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";

interface NegotiationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  originalPrice: number;
  sessionId: string;
  onSuccess: (negotiatedPrice: number) => void;
}

export function NegotiationDialog({ isOpen, onClose, productId, productName, originalPrice, sessionId, onSuccess }: NegotiationDialogProps) {
  const [offerInput, setOfferInput] = useState("");
  const [session, setSession] = useState<any>(null);
  
  const { mutate: startNeg, isPending: isStarting } = useStartNegotiation();
  const { mutate: makeOffer, isPending: isOffering } = useMakeOffer();

  useEffect(() => {
    if (isOpen && !session) {
      startNeg({
        data: { productId, sessionId, offerPrice: originalPrice } // Initial ghost offer
      }, {
        onSuccess: (data) => setSession(data)
      });
    }
  }, [isOpen, productId, sessionId, startNeg, originalPrice, session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(offerInput);
    if (!val || isNaN(val)) return;

    makeOffer({
      data: {
        sessionId,
        productId,
        offerPrice: val,
        previousOffer: session?.currentOffer
      }
    }, {
      onSuccess: (data) => {
        setSession({
          ...session,
          status: data.status,
          message: data.message,
          currentOffer: data.counterOffer || val,
          roundsLeft: data.roundsLeft
        });
        setOfferInput("");
        
        if (data.status === "accepted" && data.finalPrice) {
          setTimeout(() => {
            onSuccess(data.finalPrice!);
            onClose();
          }, 3000);
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Handshake className="w-6 h-6" />
              <h2 className="font-display font-bold text-2xl">Haggle with AI</h2>
            </div>
            <p className="text-white/80 text-sm">Negotiating: {productName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 p-4 bg-muted rounded-xl">
            <div>
              <p className="text-sm text-muted-foreground">Original Price</p>
              <p className="text-xl font-bold line-through opacity-70">{formatPrice(originalPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current AI Offer</p>
              <p className="text-2xl font-bold text-primary">
                {session?.currentOffer ? formatPrice(session.currentOffer) : formatPrice(originalPrice)}
              </p>
            </div>
          </div>

          <div className="mb-6 h-24 flex items-center justify-center text-center px-4">
            {isStarting || isOffering ? (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <Sparkles className="w-5 h-5" />
                <span>AI is evaluating your offer...</span>
              </div>
            ) : session?.status === "accepted" ? (
              <div className="text-green-500 flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8" />
                <span className="font-bold text-lg">{session.message}</span>
                <span className="text-sm text-foreground mt-2">Adding to cart...</span>
              </div>
            ) : session?.status === "rejected" ? (
              <div className="text-destructive flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8" />
                <span className="font-bold text-lg">{session.message}</span>
              </div>
            ) : (
              <div className="text-foreground italic">
                "{session?.message || "Make your first offer. Be reasonable!"}"
              </div>
            )}
          </div>

          {session?.status !== "accepted" && session?.status !== "rejected" && (
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                <span>Your Counter Offer</span>
                <span>{session?.roundsLeft || 3} rounds left</span>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                  <input
                    type="number"
                    value={offerInput}
                    onChange={(e) => setOfferInput(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full pl-8 pr-4 py-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none text-lg font-bold transition-all"
                    disabled={isOffering || isStarting}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isOffering || isStarting || !offerInput}
                  className="px-6 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Offer <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
