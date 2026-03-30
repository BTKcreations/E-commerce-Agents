import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [messages, setMessages] = useState<Array<{role: 'user'|'assistant', content: string}>>([]);
  const [round, setRound] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { mutate: startNeg, isPending: isStarting } = useStartNegotiation();
  const { mutate: makeOffer, isPending: isOffering } = useMakeOffer();

  const isLoading = isStarting || isOffering;
  const maxRounds = 3;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleClose = () => {
    setOfferInput("");
    setSession(null);
    setMessages([]);
    setRound(0);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerInput.trim()) return;

    const userMessage = offerInput.trim();
    setOfferInput("");
    
    // Add user message to local state immediately for responsiveness
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    if (round === 0) {
      startNeg(
        { data: { productId, sessionId, message: userMessage } },
        {
          onSuccess: (data) => {
            console.log("Negotiation Started Success:", data);
            setSession(data);
            setMessages((data.messageHistory as any) || []);
            setRound(1);
          },
        }
      );
    } else {
      console.log("Making Offer for ID:", session?.id);
      makeOffer(
        {
          data: {
            id: session?.id,
            sessionId,
            productId,
            message: userMessage,
          } as any,
        },
        {
          onSuccess: (data) => {
            console.log("Offer Response Success:", data);
            setSession((prev: any) => ({
              ...prev,
              status: data.status,
              message: data.message,
              currentOffer: data.counterOffer ?? prev?.currentOffer,
              roundsLeft: data.roundsLeft,
            }));
            setMessages((data.messageHistory as any) || []);
            setRound((r) => r + 1);

            if (data.status === "accepted" && data.finalPrice) {
              setTimeout(() => {
                onSuccess(data.finalPrice!);
                handleClose();
              }, 3000);
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
        className="relative w-full max-w-xl bg-card rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col h-[600px]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Handshake className="w-6 h-6" />
              <h2 className="font-bold text-2xl">Negotiation Manager</h2>
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

        {/* Current Offer Status Strip */}
        <div className="bg-muted/50 border-b border-border px-6 py-3 flex justify-between items-center shrink-0">
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Original</p>
              <p className="text-sm font-bold opacity-50">{formatPrice(originalPrice)}</p>
            </div>
            {aiCurrentOffer && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Current Offer</p>
                <p className="text-sm font-bold text-primary">{formatPrice(aiCurrentOffer)}</p>
              </div>
            )}
          </div>
          {round > 0 && !isDone && (
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50 px-2 py-1 rounded-md border border-border">
              {roundsLeft} round{roundsLeft !== 1 ? "s" : ""} left
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/20 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-8"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Handshake className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Ready to negotiate?</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  The manager is waiting for your best offer. Mention a price or ask for a discount to start the conversation.
                </p>
              </motion.div>
            ) : (
              messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                <div 
                  className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-card border border-border rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))
          )}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}

          {session?.status === "accepted" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-8 bg-green-500/10 border border-green-500/20 rounded-2xl text-center flex flex-col items-center gap-3"
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <p className="font-bold text-green-600 text-lg">Offer Accepted!</p>
                <p className="text-sm text-green-600/80">Updating your cart with the new price...</p>
              </div>
            </motion.div>
          )}

          {session?.status === "rejected" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-8 bg-destructive/10 border border-destructive/20 rounded-2xl text-center flex flex-col items-center gap-3"
            >
              <AlertCircle className="w-10 h-10 text-destructive" />
              <div>
                <p className="font-bold text-destructive text-lg">Negotiation Ended</p>
                <p className="text-sm text-destructive/80">The manager couldn't agree to that price.</p>
                <button 
                  onClick={handleClose}
                  className="mt-4 px-4 py-2 bg-background border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
                >
                  Close & Buy at Original Price
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Chat Input */}
        {!isDone && (
          <div className="p-4 bg-background border-t border-border shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={offerInput}
                onChange={(e) => setOfferInput(e.target.value)}
                placeholder="Type your offer or message..."
                className="flex-1 px-4 py-3 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !offerInput.trim()}
                className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
                title="Send Message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
