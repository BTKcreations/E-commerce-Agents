import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { BrainCircuit, TrendingUp, Handshake, HeadphonesIcon, AlertCircle, Send, Sparkles } from "lucide-react";
import { useGetPricingAlerts, useSupportChat } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const mockDemandData = [
  { time: '10:00', demand: 40 }, { time: '11:00', demand: 55 }, 
  { time: '12:00', demand: 80 }, { time: '13:00', demand: 110 },
  { time: '14:00', demand: 95 }, { time: '15:00', demand: 130 },
];

export function Dashboard() {
  const sessionId = getSessionId();
  const { data: alerts } = useGetPricingAlerts();
  
  // Support Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user'|'assistant', content: string}>>([
    { role: 'assistant', content: "Hello! I'm your AI Support Agent. How can I assist you with your orders or returns today?" }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { mutate: sendChat, isPending: isChatting } = useSupportChat();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatting]);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', content: newMsg }]);

    sendChat({
      data: { message: newMsg, sessionId, conversationHistory: chatHistory }
    }, {
      onSuccess: (data) => {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    });
  };

  return (
    <Layout>
      {/* Dashboard Header */}
      <div className="relative bg-foreground text-background py-16 mb-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={`${import.meta.env.BASE_URL}images/ai-dashboard-bg.png`} className="w-full h-full object-cover" alt="Bg" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex items-center gap-4">
          <div className="p-4 bg-primary/20 backdrop-blur-md rounded-2xl border border-primary/30">
            <BrainCircuit className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold">Agent Control Center</h1>
            <p className="text-muted opacity-80 text-lg mt-1">Monitor the autonomous AI agents powering your store</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panel 1: Demand & Pricing Agent */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bold font-display">Demand Forecast</h2>
            </div>
            
            <div className="h-[200px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockDemandData}>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="demand" stroke="hsl(var(--primary))" strokeWidth={4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h3 className="font-bold mb-4 text-muted-foreground uppercase text-xs tracking-wider">Active Alerts</h3>
            <div className="space-y-3">
              {alerts && alerts.length > 0 ? alerts.slice(0,3).map((alert, i) => (
                <div key={i} className="flex gap-3 items-start p-3 bg-muted/50 rounded-xl">
                  <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-destructive' : 'text-amber-500'
                  }`} />
                  <div>
                    <p className="font-bold text-sm">{alert.productName}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              )) : (
                <div className="p-4 bg-green-500/10 text-green-600 rounded-xl border border-green-500/20 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  All pricing and stock levels are optimal.
                </div>
              )}
            </div>
          </motion.div>

          {/* Panel 2: Negotiation Agent Logs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-3xl p-6 shadow-lg flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <Handshake className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold font-display">Negotiation Activity</h2>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 border-2 border-dashed border-border rounded-2xl">
              <BrainCircuit className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
              <p className="font-bold text-lg">Agent is actively monitoring</p>
              <p className="text-muted-foreground max-w-xs mt-2">
                Haggle sessions started by users will appear here. The AI autonomously negotiates within optimal margin parameters.
              </p>
            </div>
          </motion.div>

          {/* Panel 3: Support Agent Chat */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-3xl shadow-lg flex flex-col h-[500px] lg:col-span-2 overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-r from-muted to-background border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                  <HeadphonesIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display">Customer Support AI</h2>
                  <p className="text-sm text-green-500 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" /> Online
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-5 py-3 rounded-2xl max-w-[80%] ${
                    msg.role === 'user' 
                      ? 'bg-foreground text-background rounded-tr-sm' 
                      : 'bg-muted rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="px-5 py-3 bg-muted rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-background border-t border-border">
              <form onSubmit={handleSupportSubmit} className="relative flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message to test the support agent..."
                  className="flex-1 bg-muted border border-border rounded-xl pl-4 pr-4 py-4 focus:outline-none focus:border-primary transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={isChatting || !chatInput}
                  className="px-6 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 font-bold flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
}
