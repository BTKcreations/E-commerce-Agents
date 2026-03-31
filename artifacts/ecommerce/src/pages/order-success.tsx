import { useRoute, Link } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { formatPrice } from "@/lib/utils";
import { 
  CheckCircle2, 
  Download, 
  Printer, 
  Package, 
  Truck, 
  Calendar,
  CreditCard,
  ArrowRight,
  Sparkles,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { useRef } from "react";

export function OrderSuccessPage() {
  const [, params] = useRoute("/order-success/:id");
  const orderId = params?.id ? parseInt(params.id) : 0;
  const { data: order, isLoading } = useGetOrder(orderId);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const downloadInvoice = () => {
    if (!order) return;
    
    const doc = new jsPDF();
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    
    doc.setFontSize(22);
    doc.text("INVOICE - omnexa", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Order ID: #${order.id}`, 20, 40);
    doc.text(`Date: ${new Date(order.createdAt || "").toLocaleDateString()}`, 20, 50);
    doc.text(`Status: ${order.status}`, 20, 60);
    doc.text(`Shipping Address: ${order.shippingAddress || "N/A"}`, 20, 70);
    
    doc.line(20, 80, 190, 80);
    
    doc.text("Item", 20, 90);
    doc.text("Qty", 140, 90);
    doc.text("Price", 170, 90);
    
    let y = 100;
    items.forEach((item: any) => {
      const price = item.negotiatedPrice || item.product?.price || 0;
      doc.text(item.product?.name?.substring(0, 40) || "Product", 20, y);
      doc.text(String(item.quantity), 140, y);
      doc.text(formatPrice(price), 170, y);
      y += 10;
    });
    
    doc.line(20, y, 190, y);
    doc.setFontSize(14);
    doc.text(`Total: ${formatPrice(Number(order.total))}`, 150, y + 10);
    
    doc.save(`invoice_${order.id}.pdf`);
  };

  if (isLoading) return <Layout><div className="flex items-center justify-center h-[60vh]">Loading order...</div></Layout>;
  if (!order) return <Layout><div className="flex items-center justify-center h-[60vh]">Order not found</div></Layout>;

  const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-500/5">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-5xl font-display font-black mb-4">Order Confirmed!</h1>
          <p className="text-xl text-muted-foreground flex items-center justify-center gap-2">
            Order <span className="font-bold text-foreground">#{order.id}</span> is on its way to your doorstep.
            <Sparkles className="w-5 h-5 text-primary" />
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           <div className="bg-card border border-border p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                 <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Date</p>
                <p className="font-bold">{new Date(order.createdAt || "").toLocaleDateString()}</p>
              </div>
           </div>
           <div className="bg-card border border-border p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                 <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Shipping</p>
                <p className="font-bold">Standard Delivery</p>
              </div>
           </div>
           <div className="bg-card border border-border p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                 <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Status</p>
                <p className="font-bold capitalize">{order.status}</p>
              </div>
           </div>
        </div>

        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
          <div className="p-8 md:p-12">
            <div className="flex justify-between items-start mb-12">
               <div>
                  <h2 className="text-3xl font-display font-black text-primary mb-1">INVOICE</h2>
                  <p className="text-muted-foreground">Invoice No: INV-{order.id}-{new Date().getFullYear()}</p>
               </div>
               <div className="text-right">
                  <p className="font-bold text-lg">omnexa Solutions</p>
                  <p className="text-sm text-muted-foreground">123 Commerce Avenue</p>
                  <p className="text-sm text-muted-foreground">Bangalore, KA 560001</p>
               </div>
            </div>

            <div className="mb-12">
               <h3 className="text-xs font-black uppercase text-muted-foreground mb-4 tracking-widest">Bill To</h3>
               <p className="text-xl font-bold mb-1">{order.shippingAddress?.split(',')[0] || "Customer"}</p>
               <p className="text-muted-foreground italic max-w-sm">{order.shippingAddress}</p>
            </div>

            <table className="w-full mb-12">
               <thead>
                  <tr className="border-b-2 border-border text-left">
                    <th className="pb-4 font-black uppercase text-xs tracking-widest text-muted-foreground">Description</th>
                    <th className="pb-4 font-black uppercase text-xs tracking-widest text-muted-foreground text-center">Qty</th>
                    <th className="pb-4 font-black uppercase text-xs tracking-widest text-muted-foreground text-right">Price</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                  {orderItems.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-6">
                        <p className="font-bold">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">{item.product?.category}</p>
                      </td>
                      <td className="py-6 text-center font-medium">{item.quantity}</td>
                      <td className="py-6 text-right font-bold">
                        {formatPrice(item.negotiatedPrice || item.product?.price || 0)}
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>

            <div className="flex justify-end">
               <div className="w-full md:w-64 space-y-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-bold text-foreground">{formatPrice(Number(order.total))}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-green-500 font-bold uppercase text-xs">Free</span>
                  </div>
                  <div className="pt-4 border-t-4 border-primary/20 flex justify-between items-end">
                    <span className="font-black uppercase text-sm">Grand Total</span>
                    <span className="text-3xl font-black text-primary">{formatPrice(Number(order.total))}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-muted/30 p-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground italic">Thank you for choosing omnexa. Your business is appreciated!</p>
             </div>
             <div className="flex gap-4">
                <button 
                  onClick={() => window.print()}
                  className="p-3 bg-card border border-border rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                  title="Print Invoice"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button 
                  onClick={downloadInvoice}
                  className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-all shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
           <Link href="/products" className="text-muted-foreground font-bold hover:text-primary transition-all flex items-center gap-2">
              Continue Shopping <ArrowRight className="w-5 h-5" />
           </Link>
        </div>
      </div>
    </Layout>
  );
}
