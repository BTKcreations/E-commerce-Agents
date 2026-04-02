import { useState } from "react";
import { Layout } from "@/components/layout";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Package, 
  Image as ImageIcon,
  Tag,
  Layers,
  BarChart3,
  AlertCircle,
  TrendingUp,
  LineChart as LineChartIcon,
  CheckCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { 
  useListProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  useGetPricingForecast,
  useAdjustPrice
} from "@workspace/api-client-react";
import { formatPrice, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid } from "recharts";

// Mock demand history for the chart
const mockDemandHistory = [
  { day: 'Mon', demand: 45 }, { day: 'Tue', demand: 52 }, 
  { day: 'Wed', demand: 48 }, { day: 'Thu', demand: 70 },
  { day: 'Fri', demand: 85 }, { day: 'Sat', demand: 110 },
  { day: 'Sun', demand: 95 },
];

const CATEGORY_MAP: Record<string, string[]> = {
  "Electronics": ["MOBILES", "TABS", "LAPTOPS", "CAMERAS"],
  "WEARABLES": ["WATCHES", "RINGS", "SUNGLASSES"],
  "Audio": ["SPEAKERS", "EARPHONES"],
  "Fashion": ["SHIRTS", "T SHIRTS", "JEANS", "KUTHAS AND DRESSE", "FOOTWEAR"],
  "Appliances": ["TV", "AC", "REFRIGERATOR", "WASHING MACHINE"]
};

export function ProductManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Forecasting State
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);

  const { data: products, refetch } = useListProducts({ search: searchTerm });
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  // Forecast Hooks
  const { data: forecast, isLoading: isForecastLoading } = useGetPricingForecast(
    { productId: selectedProductId! }, 
    { query: { enabled: !!selectedProductId } }
  );
  const { mutate: adjustPrice, isPending: isAdjusting } = useAdjustPrice();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    subcategory: "",
    brand: "",
    imageUrl: "",
    stock: 0,
    tags: [] as string[],
    specs: {} as Record<string, string>
  });
  
  const [specRows, setSpecRows] = useState<Array<{key: string, value: string}>>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        category: product.category,
        subcategory: product.subcategory || "",
        brand: product.brand || "",
        imageUrl: product.imageUrl || "",
        stock: product.stock,
        tags: product.tags || [],
        specs: product.specs || {}
      });
      const specs = Object.entries(product.specs || {}).map(([key, value]) => ({ key, value: String(value) }));
      setSpecRows(specs);
      setIsCustomCategory(!Object.keys(CATEGORY_MAP).includes(product.category));
      setIsCustomSubcategory(product.category && !CATEGORY_MAP[product.category]?.includes(product.subcategory));
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "",
        subcategory: "",
        brand: "",
        imageUrl: "",
        stock: 0,
        tags: [],
        specs: {}
      });
      setSpecRows([{ key: "Brand", value: "" }, { key: "SKU", value: "" }]);
      setIsCustomCategory(false);
      setIsCustomSubcategory(false);
    }
    setIsModalOpen(true);
  };

  const addSpecRow = () => setSpecRows([...specRows, { key: "", value: "" }]);
  const updateSpecRow = (idx: number, field: "key" | "value", val: string) => {
    const newRows = [...specRows];
    newRows[idx][field] = val;
    setSpecRows(newRows);
  };
  const removeSpecRow = (idx: number) => setSpecRows(specRows.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process specs array into object
    const finalSpecs: Record<string, string> = {};
    specRows.forEach(row => {
      if (row.key.trim()) finalSpecs[row.key.trim()] = row.value;
    });

    const submissionData = {
      ...formData,
      specs: finalSpecs
    };

    if (editingProduct) {
      updateProduct({
        id: editingProduct.id,
        data: submissionData
      }, {
        onSuccess: () => {
          toast({ title: "Product Updated", description: `${formData.name} has been updated.` });
          setIsModalOpen(false);
          refetch();
        }
      });
    } else {
      createProduct({
        data: submissionData
      }, {
        onSuccess: () => {
          toast({ title: "Product Created", description: `${formData.name} has been added to catalog.` });
          setIsModalOpen(false);
          refetch();
        }
      });
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteProduct({ id }, {
        onSuccess: () => {
          toast({ title: "Product Deleted", description: `${name} has been removed successfully.` });
          refetch();
        },
        onError: (err: any) => {
          console.error("Delete Error:", err);
          const errorMsg = err.response?.data?.error || err.message || "Failed to delete product";
          toast({ 
            variant: "destructive",
            title: "Delete Failed", 
            description: errorMsg
          });
        }
      });
    }
  };

  const handleApplyPriceAdjustment = () => {
    if (!selectedProductId) return;
    adjustPrice({
      data: { productId: selectedProductId, reason: "Applying AI recommendation" }
    }, {
      onSuccess: (data: any) => {
        toast({ 
          title: "Price Adjusted", 
          description: `Price changed from ${formatPrice(data.oldPrice)} to ${formatPrice(data.newPrice)}` 
        });
        refetch();
        setIsForecastModalOpen(false);
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
              <Package className="w-10 h-10 text-primary" />
              Product Management
            </h1>
            <p className="text-muted-foreground text-lg mt-2">Manage your inventory, prices, and product details</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-black/10 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New Product
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-card border border-border rounded-3xl p-6 mb-8 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input 
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider">Product</th>
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider">Category</th>
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider">Subcategory</th>
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider">Price</th>
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products?.map((product) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={product.id} 
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-border/50 shrink-0">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.brand || "No Brand"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-tighter">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full uppercase tracking-tighter">
                        {(product as any).subcategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-display font-medium text-lg">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          product.stock > 10 ? "bg-green-500" : "bg-amber-500"
                        )} />
                        <span className="font-medium">{product.stock} units</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setIsForecastModalOpen(true);
                          }}
                          title="View Forecast"
                          className="p-2 hover:bg-accent/10 text-muted-foreground hover:text-accent rounded-xl transition-all"
                        >
                          <TrendingUp className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(product)}
                          title="Edit Product"
                          className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          disabled={isDeleting}
                          onClick={() => handleDelete(product.id, product.name)}
                          title="Delete Product"
                          className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all disabled:opacity-50"
                        >
                          {isDeleting ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm shadow-2xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    {editingProduct ? <Pencil className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                    <p className="text-sm text-muted-foreground">Fill in the details below</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <Package className="w-4 h-4" /> Product Name
                    </label>
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                      placeholder="e.g. Premium Wireless Headphones"
                    />
                  </div>
                   <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Category
                    </label>
                    <select 
                      required
                      value={isCustomCategory ? "CUSTOM" : formData.category}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "CUSTOM") {
                          setIsCustomCategory(true);
                          setFormData({ ...formData, category: "", subcategory: "" });
                        } else {
                          setIsCustomCategory(false);
                          setFormData({ ...formData, category: val, subcategory: "" });
                        }
                      }}
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="">Select Category</option>
                      {Object.keys(CATEGORY_MAP).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="CUSTOM">+ Add New Category</option>
                    </select>
                    {isCustomCategory && (
                      <motion.input 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        placeholder="Enter New Category Name"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full mt-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-primary font-bold placeholder:text-primary/30"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Subcategory
                    </label>
                    <select 
                      required
                      value={isCustomSubcategory ? "CUSTOM" : formData.subcategory}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "CUSTOM") {
                          setIsCustomSubcategory(true);
                          setFormData({ ...formData, subcategory: "" });
                        } else {
                          setIsCustomSubcategory(false);
                          setFormData({ ...formData, subcategory: val });
                        }
                      }}
                      disabled={!formData.category}
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                    >
                      <option value="">Select Subcategory</option>
                      {formData.category && CATEGORY_MAP[formData.category]?.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                      <option value="CUSTOM">+ Add New Subcategory</option>
                    </select>
                    {isCustomSubcategory && (
                      <motion.input 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        placeholder="Enter New Subcategory Name"
                        value={formData.subcategory}
                        onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                        className="w-full mt-2 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-accent font-bold placeholder:text-accent/30"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Product Specifications
                    </label>
                    <button 
                      type="button" 
                      onClick={addSpecRow}
                      className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {specRows.map((spec, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx} 
                        className="flex gap-3 items-start"
                      >
                        <input 
                          placeholder="Attribute (e.g. Color)"
                          value={spec.key}
                          onChange={e => updateSpecRow(idx, "key", e.target.value)}
                          className="flex-[2] bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                        />
                        <input 
                          placeholder="Value (e.g. Red)"
                          value={spec.value}
                          onChange={e => updateSpecRow(idx, "value", e.target.value)}
                          className="flex-[3] bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                        />
                        <button 
                          type="button"
                          onClick={() => removeSpecRow(idx)}
                          className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                    {specRows.length === 0 && (
                      <p className="text-xs text-center text-muted-foreground py-4 border-2 border-dashed border-border rounded-2xl">
                        No specifications added yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all min-h-[100px]"
                    placeholder="Tell us about the product..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Price ($)
                    </label>
                    <input 
                      type="number"
                      required
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Stock Quantity
                    </label>
                    <input 
                      type="number"
                      required
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Image URL
                  </label>
                  <input 
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 border border-border rounded-2xl font-bold hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {isCreating || isUpdating ? "Saving..." : (editingProduct ? "Update Product" : "Create Product")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Forecast Modal */}
      <AnimatePresence>
        {isForecastModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsForecastModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border flex items-center justify-between bg-accent/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/20 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold">AI Demand Forecast</h2>
                    <p className="text-muted-foreground">Product Insights & Dynamic Pricing Engine</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsForecastModalOpen(false)}
                  className="p-3 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                {isForecastLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="font-bold text-accent animate-pulse">Analyzing Market Trends...</p>
                  </div>
                ) : forecast ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Stats */}
                    <div className="space-y-6">
                      <div className="bg-muted/50 p-6 rounded-3xl border border-border">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Demand Level</p>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-3xl font-display font-extrabold uppercase",
                            forecast.demandLevel === 'surge' ? 'text-destructive' : 'text-primary'
                          )}>
                            {forecast.demandLevel}
                          </span>
                          {forecast.demandLevel === 'surge' && <TrendingUp className="w-6 h-6 text-destructive animate-bounce" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{forecast.forecast}</p>
                      </div>

                      <div className="bg-muted/50 p-6 rounded-3xl border border-border">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Pricing Strategy</p>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Current Price</span>
                            <span className="font-bold">{formatPrice(forecast.currentPrice)}</span>
                          </div>
                          <div className="flex items-center justify-center p-2 bg-background rounded-xl">
                            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 lg:rotate-0" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-accent font-bold">Suggested</span>
                            <span className="text-2xl font-display font-black text-accent">{formatPrice(forecast.suggestedPrice)}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleApplyPriceAdjustment}
                        disabled={isAdjusting}
                        className="w-full py-5 bg-accent text-white rounded-2xl font-black text-lg shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isAdjusting ? "Updating..." : (
                          <>
                            <CheckCircle className="w-6 h-6" />
                            Apply AI Price
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right Column: Chart & Insights */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="font-bold flex items-center gap-2">
                            <LineChartIcon className="w-5 h-5 text-primary" />
                            7-Day Demand Forecast
                          </h3>
                          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">Real-time Data</span>
                        </div>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockDemandHistory}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                              <YAxis hide domain={[0, 'auto']} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.15)' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="demand" 
                                stroke="hsl(var(--accent))" 
                                strokeWidth={5} 
                                dot={{r: 6, fill: 'hsl(var(--accent))', strokeWidth: 0}}
                                activeDot={{r: 8, strokeWidth: 0}}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                          <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                          <div>
                            <h4 className="font-bold text-blue-900 text-sm">Market Insight</h4>
                            <p className="text-xs text-blue-700 mt-1">Competitor prices are rising for similar items in your category.</p>
                          </div>
                        </div>
                        <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                          <div>
                            <h4 className="font-bold text-amber-900 text-sm">Stock Alert</h4>
                            <p className="text-xs text-amber-700 mt-1">Based on surge demand, you may run out of stock in 4 days.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-muted-foreground">Unable to generate forecast for this product.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

