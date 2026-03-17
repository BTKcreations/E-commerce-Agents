import { Link } from "wouter";
import { Star, TrendingDown, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@workspace/api-client-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {/* stock headphones desk minimal */}
        <img 
          src={product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* AI Dynamic Pricing Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span className="bg-gradient-to-r from-accent to-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
            </span>
          </div>
        )}

        {/* AI Reason Badge - mock logic for visual */}
        {product.demandScore && product.demandScore > 80 && (
          <div className="absolute top-3 right-3">
             <span className="bg-gradient-to-r from-primary to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              High Demand
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {product.category}
          </span>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium text-foreground">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
        </div>

        <Link href={`/products/${product.id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="font-display font-bold text-lg line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </Link>
        
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto pt-4 flex items-end justify-between">
          <div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through mr-2">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="font-display font-bold text-xl text-foreground">
              {formatPrice(product.price)}
            </span>
          </div>
          <Link 
            href={`/products/${product.id}`}
            className="px-4 py-2 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
