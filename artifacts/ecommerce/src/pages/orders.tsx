import { Package, ChevronRight } from "lucide-react";
import { useListOrders } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Layout } from "@/components/layout";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { Link } from "wouter";

export function Orders() {
  const sessionId = getSessionId();
  const { data: orders, isLoading } = useListOrders({ sessionId });

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Order History</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2].map(n => <div key={n} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="bg-muted/50 p-6 border-b border-border flex flex-wrap gap-6 justify-between items-center relative z-10">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Order Placed</p>
                    <p className="font-medium">{order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "Recently"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                    <p className="font-bold text-lg">{formatPrice(order.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Order ID</p>
                    <p className="font-medium">#{order.id.toString().padStart(6, '0')}</p>
                  </div>
                  <div className="flex-1 flex justify-end">
                    <Link href={`/order-success/${order.id}`}>
                      <button className="bg-primary text-primary-foreground hover:opacity-90 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 whitespace-nowrap">
                        View Invoice
                      </button>
                    </Link>
                  </div>
                </div>
                
                <div className="p-6">
                  {order.items.map((item, idx) => (
                    <div key={item.id} className={`flex items-center gap-4 ${idx !== 0 ? 'mt-6 pt-6 border-t border-border/50' : ''}`}>
                      <Link href={`/products/${item.productId}`}>
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                           <img 
                            src={item.product?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"} 
                            alt={item.product?.name || "Product"} className="w-full h-full object-cover" 
                          />
                        </div>
                      </Link>
                      <div className="flex-1">
                        <Link href={`/products/${item.productId}`} className="hover:underline hover:text-primary transition-colors">
                          <h4 className="font-bold">{item.product?.name}</h4>
                        </Link>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <Link href={`/order-success/${order.id}`}>
                        <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors group-hover:bg-primary/5">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-card rounded-3xl border border-border">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No orders found</h2>
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
