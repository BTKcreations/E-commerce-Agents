import React, { useState, useEffect } from "react";
import { Search, Sparkles, Filter, SlidersHorizontal, Star, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useListProducts, useChatSearch, ListProductsSortBy } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Layout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { formatPrice, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Products() {
  const sessionId = getSessionId();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<ListProductsSortBy | "relevance">("relevance");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [minRating, setMinRating] = useState<number | null>(null);
  
  const [metadata, setMetadata] = useState<{ 
    categories: { name: string, count: number }[], 
    subcategories: { name: string, count: number }[],
    brands: { name: string, count: number }[],
    priceRange: { min: number, max: number }, 
    totalCount: number 
  }>({
    categories: [],
    subcategories: [],
    brands: [],
    priceRange: { min: 0, max: 0 },
    totalCount: 0
  });

  const { data: standardProducts, isLoading } = useListProducts({ 
    category: activeCategory !== "All" ? activeCategory : undefined,
    subcategory: activeSubcategory || undefined,
    sortBy: sortBy !== "relevance" ? sortBy : undefined,
    brands: selectedBrands.length > 0 ? selectedBrands.join(",") : undefined,
    minPrice: priceRange[0] > metadata.priceRange.min ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < metadata.priceRange.max ? priceRange[1] : undefined,
    minRating: minRating || undefined
  } as any);
  
  const { mutate: doChatSearch, data: aiSearchResults, isPending: isSearching } = useChatSearch();

  // Fetch metadata for dynamic filters
  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (activeCategory !== "All") params.append("category", activeCategory);
      
      try {
        const res = await fetch(`/api/products/metadata?${params.toString()}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setMetadata(prev => ({ ...prev, ...data }));
          
          // Reset slider ONLY when category or search changes
          if (priceRange[1] === 1000000 || data.priceRange?.max > 0) {
            // Check if we need a reset (e.g. initial load or category change)
            const isInitial = priceRange[1] === 1000000;
            if (isInitial) {
              setPriceRange([data.priceRange.min, data.priceRange.max]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch metadata:", err);
      }
    };
    
    fetchMetadata();
    return () => { isMounted = false; };
  }, [searchQuery, activeCategory, activeSubcategory, selectedBrands]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const clearAllFilters = () => {
    setActiveCategory("All");
    setActiveSubcategory(null);
    setSearchQuery("");
    setSelectedBrands([]);
    setPriceRange([metadata.priceRange.min, metadata.priceRange.max]);
    setMinRating(null);
    setSortBy("relevance");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    doChatSearch({ data: { query: searchQuery, sessionId } });
  };

  // Derive categories from metadata
  const categories = ["All", ...metadata.categories.map(c => c.name)];
  
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
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Categories</h4>
                  {(activeCategory !== "All") && (
                    <button onClick={() => setActiveCategory("All")} className="text-[10px] text-primary hover:underline font-bold">Reset</button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {categories.map(cat => {
                    const count = metadata.categories?.find(c => c.name === cat)?.count || 
                                 (cat === "All" ? metadata.totalCount : 0);
                    return (
                      <React.Fragment key={cat}>
                        <button
                          onClick={() => {
                            setActiveCategory(cat);
                            setActiveSubcategory(null);
                            setSelectedBrands([]);
                            if (aiSearchResults) setSearchQuery("");
                          }}
                          className={`group flex items-center justify-between w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                            activeCategory === cat 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <span className="truncate text-sm">{cat}</span>
                          {count > 0 && (
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                              activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-border"
                            )}>
                              {count}
                            </span>
                          )}
                        </button>
                        
                        {/* Subcategories (Nested) */}
                        {activeCategory === cat && activeCategory !== "All" && metadata.subcategories.length > 0 && (
                          <div className="ml-4 mt-1 mb-2 space-y-1 border-l border-primary/20 pl-2">
                            {metadata.subcategories.map(sub => (
                              <button
                                key={sub.name}
                                onClick={() => setActiveSubcategory(activeSubcategory === sub.name ? null : sub.name)}
                                className={cn(
                                  "flex items-center justify-between w-full text-[11px] py-1 px-2 rounded-md transition-all",
                                  activeSubcategory === sub.name 
                                    ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                              >
                                <span className="truncate uppercase">{sub.name}</span>
                                <span className="opacity-60 font-medium">{sub.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border/50">
                <h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Price Range</h4>
                <div className="px-2">
                  <div className="flex justify-between text-xs font-bold mb-3">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                  <input
                    type="range"
                    min={metadata.priceRange.min}
                    max={metadata.priceRange.max}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-primary bg-muted rounded-lg h-1.5 cursor-pointer"
                  />
                </div>
              </div>

              {/* Brands */}
              {metadata.brands && metadata.brands.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Brands</h4>
                    {selectedBrands.length > 0 && (
                      <button onClick={() => setSelectedBrands([])} className="text-[10px] text-primary hover:underline font-bold">Clear</button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
                    {metadata.brands.map(brand => (
                      <label key={brand.name} className="flex items-center gap-2 group cursor-pointer">
                        <div 
                          onClick={() => toggleBrand(brand.name)}
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            selectedBrands.includes(brand.name) ? "bg-primary border-primary" : "border-border bg-background group-hover:border-primary/50"
                          )}
                        >
                          {selectedBrands.includes(brand.name) && <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />}
                        </div>
                        <span className={cn(
                          "text-sm transition-colors",
                          selectedBrands.includes(brand.name) ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {brand.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 ml-auto">{brand.count}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Ratings */}
              <div className="mb-8">
                <h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Customer Ratings</h4>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(minRating === rating ? null : rating)}
                      className={cn(
                        "flex items-center gap-2 w-full text-sm py-1 rounded-lg transition-all",
                        minRating === rating ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={cn("w-3.5 h-3.5", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                      <span className="mt-0.5">& Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear All */}
              {(activeCategory !== "All" || selectedBrands.length > 0 || minRating !== null || searchQuery !== "") && (
                <button 
                  onClick={clearAllFilters}
                  className="w-full py-2.5 rounded-xl border border-dashed border-border hover:border-primary hover:text-primary text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-3 h-3" />
                  Clear All Filters
                </button>
              )}
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
              
              <div className="flex items-center gap-3">
                <div className="relative group/sort">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none flex items-center gap-2 pl-10 pr-10 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors font-medium text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="relevance">Sort By: Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="newest">Newest Arrivals</option>
                  </select>
                  <SlidersHorizontal className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
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
                  onClick={clearAllFilters}
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
