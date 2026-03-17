import { useState } from "react";
import { motion } from "framer-motion";
import { Handshake, X, Send, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
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

export function NegotiationDialog({
  isOpen,
  onClose,
  productId,
  productName,
  originalPrice,
  sessionId,
  onSuccess,
}: NegotiationDialogProps) {
  const [offerInput, setOfferInput] = useState("");
  const [session, setSession] = useState<any>(null);
  const [round, setRound] = useState(0);

  const { mutate: startNeg, isPending: isStarting } = useStartNegotiation();
  const { mutate: makeOffer, isPending: isOffering } = useMakeOffer();

  const isLoading = isStarting || isOffering;
  const maxRounds = 3;

  const handleClose = () => {
    // Reset all state when closing so next open is fresh
    setOfferInput("");
    setSession(null);
    setRound(0);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(offerInput);
    if (!val || isNaN(val) || val <= 0) return;

    setOfferInput("");

    if (round === 0) {
      // First offer → start a new negotiation session
      startNeg(
        { data: { productId, sessionId, offerPrice: val } },
        {
          onSuccess: (data) => {
            setSession(data);
            setRound(1);
          },
        }
      );
    } else {
      // Subsequent rounds → counter-offer
      makeOffer(
        {
          data: {
            sessionId,
            productId,
            offerPrice: val,
            previousOffer: session?.currentOffer,
          },
        },
        {
          onSuccess: (data) => {
            setSession((prev: any) => ({
              ...prev,
              status: data.status,
              message: data.message,
              currentOffer: data.counterOffer ?? prev?.currentOffer,
              roundsLeft: data.roundsLeft,
            }));
            setRound((r) => r + 1);

            if (data.status === "accepted" && data.finalPrice) {
              setTimeout(() => {
                onSuccess(data.finalPrice!);
                handleClose();
              }, 2500);
            }
          },
        }
      );
    }
  };

  if (!isOpen) return null;

  const isDone = session?.status === "accepted" || session?.status === "rejected";
  const roundsLeft = session?.roundsLeft ?? maxRounds;
  const aiCurrentOffer = session?.currentOffer;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Handshake className="w-6 h-6" />
              <h2 className="font-bold text-2xl">Haggle with AI</h2>
            </div>
            <p className="text-white/80 text-sm">Negotiating: {productName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Price Display */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 p-4 bg-muted rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Original Price</p>
              <p className="text-xl font-bold line-through opacity-50">{formatPrice(originalPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                {aiCurrentOffer ? "AI's Counter Offer" : "Max Discount"}
              </p>
              <p className="text-2xl font-bold text-primary">
                {aiCurrentOffer
                  ? formatPrice(aiCurrentOffer)
                  : formatPrice(Math.round(originalPrice * 0.8))}
              </p>
            </div>
          </div>

          {/* AI Message / Status */}
          <div className="mb-6 min-h-[80px] flex items-center justify-center text-center px-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>AI is evaluating your offer...</span>
              </div>
            ) : session?.status === "accepted" ? (
              <div className="text-green-500 flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8" />
                <span className="font-bold text-lg">{session.message}</span>
                <span className="text-sm text-foreground">Adding to your cart...</span>
              </div>
            ) : session?.status === "rejected" ? (
              <div className="text-destructive flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8" />
                <span className="font-bold text-lg">{session.message}</span>
                <button
                  onClick={handleClose}
                  className="mt-2 text-sm text-muted-foreground underline hover:text-foreground"
                >
                  Buy at original price instead
                </button>
              </div>
            ) : session?.message ? (
              <div className="text-foreground italic text-base">
                "{session.message}"
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                <p className="font-medium text-foreground mb-1">Make your first offer!</p>
                <p>The AI will negotiate with you. You can get up to 20% off.</p>
              </div>
            )}
          </div>

          {/* Offer Input */}
          {!isDone && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                <span>{round === 0 ? "Your Opening Offer" : "Your Counter Offer"}</span>
                {round > 0 && (
                  <span className="font-medium">
                    {roundsLeft} round{roundsLeft !== 1 ? "s" : ""} left
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={offerInput}
                    onChange={(e) => setOfferInput(e.target.value)}
                    placeholder={`Max ${(originalPrice * 0.8).toFixed(0)}...`}
                    className="w-full pl-8 pr-4 py-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none text-lg font-bold transition-all"
                    disabled={isLoading}
                    min={1}
                    max={originalPrice}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !offerInput}
                  className="px-6 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {round === 0 ? "Start" : "Offer"} <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Hint: Offer around {formatPrice(Math.round(originalPrice * 0.85))} for a good chance of success
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
