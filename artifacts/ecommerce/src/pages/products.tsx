import { useState } from "react";
import { Search, Sparkles, Filter, SlidersHorizontal } from "lucide-react";
import { useListProducts, useChatSearch } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Layout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { motion, AnimatePresence } from "framer-motion";

export function Products() {
  const sessionId = getSessionId();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  const { data: standardProducts, isLoading } = useListProducts({ 
    category: activeCategory !== "All" ? activeCategory : undefined 
  });
  
  const { mutate: doChatSearch, data: aiSearchResults, isPending: isSearching } = useChatSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    doChatSearch({ data: { query: searchQuery, sessionId } });
  };

  const categories = ["All", "Electronics", "Wearables", "Home Decor", "Audio", "Fitness", "Kitchen", "Office", "Clothing", "Sports"];
  
  const displayProducts = aiSearchResults ? aiSearchResults.products : standardProducts;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & AI Search */}
        <div className="bg-card rounded-3xl p-8 mb-10 shadow-lg border border-border/50 bg-gradient-to-br from-card to-muted">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl font-display font-bold mb-4">Find exactly what you need</h1>
            <p className="text-muted-foreground text-lg">
              Use natural language to search. Try <span className="text-primary font-medium italic">"Show me running shoes under ₹3000"</span>
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Sparkles className="h-6 w-6 text-primary group-focus-within:animate-pulse" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-14 pr-32 py-5 rounded-2xl bg-background border-2 border-border text-lg focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 shadow-sm"
              placeholder="Search for products..."
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? "Thinking..." : "Search"}
            </button>
          </form>

          {aiSearchResults && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 max-w-2xl mx-auto p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-start gap-3 text-primary-foreground dark:text-primary"
            >
              <Sparkles className="w-5 h-5 mt-0.5 shrink-0" />
              <p><strong>Search Interpretation:</strong> {aiSearchResults.interpretation}</p>
            </motion.div>
          )}
        </div>

        {/* Filters & Grid */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-28 bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-bold text-lg">Filters</h3>
              </div>
              
              <div className="mb-8">
                <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Categories</h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        // Clear AI search when category changes
                        if (aiSearchResults) setSearchQuery("");
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        activeCategory === cat 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display">
                {aiSearchResults ? "Search Results" : `${activeCategory} Products`}
                <span className="text-muted-foreground text-base font-normal ml-2">
                  ({displayProducts?.length || 0})
                </span>
              </h2>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                Sort By
              </button>
            </div>

            {isLoading || isSearching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(n => (
                  <div key={n} className="h-[400px] bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : displayProducts && displayProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {displayProducts.map((product: any, i: number) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-2xl border border-border/50">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
                <button 
                  onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
                  className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
