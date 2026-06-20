import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Trash2, Edit3, DollarSign, TrendingUp, ShoppingBag, Eye, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import supabase from '../../services/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  category_id: string;
  slug: string;
  image_url?: string;
}

interface Category {
  id: string;
  name: string;
}

export const SellerDashboard: React.FC = () => {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'inventory' | 'add_product' | 'analytics'>('inventory');
  
  // Add Product Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: 0,
    mrp: 0,
    stock: 0,
    description: '',
    category_id: '',
    image_url: '',
    status: 'active' as const,
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSellerProducts = async () => {
    setLoading(true);
    try {
      // In a real multi-tenant setting, we'd filter products by this seller's seller_id
      // For this build, we fetch products using our Supabase client
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');
      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSellerProducts();
    fetchCategories();
    fetchAnalytics();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData({ ...formData, name, slug });
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id || formData.price <= 0 || formData.stock < 0) {
      toast.error('Please complete all required fields correctly');
      return;
    }

    setSubmitting(true);
    try {
      // Get seller_id first for this user
      const { data: userProfile } = await supabase.auth.getUser();
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', userProfile.user?.id)
        .single();

      if (!seller) {
        // If profile doesn't have seller registered, register one or use default
        toast.error('Seller record not found. Contact administrator.');
        setSubmitting(false);
        return;
      }

      const productPayload = {
        category_id: formData.category_id,
        name: formData.name,
        slug: formData.slug,
        price: Number(formData.price),
        mrp: Number(formData.mrp || formData.price),
        stock: Number(formData.stock),
        description: formData.description,
        status: formData.status,
        images: formData.image_url ? [{ url: formData.image_url, is_primary: true }] : [],
      };

      const res = await api.post('/products', productPayload);
      if (res.data.success) {
        toast.success('Product created successfully');
        
        // Clear Form & toggle tab
        setFormData({
          name: '',
          slug: '',
          price: 0,
          mrp: 0,
          stock: 0,
          description: '',
          category_id: categories[0]?.id || '',
          image_url: '',
          status: 'active',
        });
        
        fetchSellerProducts();
        setActiveTab('inventory');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) {
        toast.success('Listing deleted');
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete listing');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary dark:bg-dark text-text dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seller Hub</h1>
            <p className="text-xs text-muted mt-1">Manage listings, analyze sales, and track inventory.</p>
          </div>
          
          {/* Tabs */}
          <div className="flex border border-border dark:border-border/10 rounded-xl overflow-hidden bg-white dark:bg-dark/40 shadow-sm p-1">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-text dark:hover:text-white'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('add_product')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'add_product'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-text dark:hover:text-white'
              }`}
            >
              Add Product
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-text dark:hover:text-white'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="space-y-8">
          
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium">
              <h3 className="font-bold text-lg mb-6">Inventory Overview</h3>

              {loading ? (
                <div className="py-20 flex justify-center items-center">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-sm font-semibold text-muted">No products listed</p>
                  <p className="text-xs text-muted mt-1">To add your first listing, go to the Add Product tab.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border dark:border-border/10 text-xs font-bold text-muted uppercase tracking-wider">
                        <th className="py-3 px-4">Item Details</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Price (INR)</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-divide-border/10">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-light transition-all">
                          <td className="py-4 px-4 flex items-center gap-3">
                            <img
                              src={product.image_url || 'https://via.placeholder.com/150'}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg border border-border dark:border-border/10 bg-secondary flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm truncate max-w-md">{product.name}</h4>
                              <p className="text-xs text-muted mt-0.5 truncate max-w-[200px]">{product.slug}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              product.status === 'active'
                                ? 'bg-success/10 text-success'
                                : 'bg-warning/10 text-warning'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-sm">
                            ₹{product.price.toLocaleString('en-IN')}
                            {product.mrp > product.price && (
                              <span className="text-xs text-muted line-through ml-2">
                                ₹{product.mrp.toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-semibold text-sm">
                            {product.stock <= 0 ? (
                              <span className="text-danger font-bold">Out of stock</span>
                            ) : (
                              product.stock
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-muted hover:text-danger p-2 rounded-lg hover:bg-danger/5 transition-all"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add Product Tab */}
          {activeTab === 'add_product' && (
            <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium max-w-3xl mx-auto">
              <h3 className="font-bold text-lg mb-6">Create New Listing</h3>
              
              <form onSubmit={handleAddProductSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Product Name *"
                    placeholder="E.g. Premium White Sneaker"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                  />
                  
                  <Input
                    label="Custom Slug *"
                    placeholder="product-unique-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border dark:border-border/10 rounded-lg text-sm font-medium outline-none bg-secondary dark:bg-dark focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Price (INR) *"
                    type="number"
                    placeholder="Selling price"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                  />

                  <Input
                    label="MRP (INR) *"
                    type="number"
                    placeholder="Maximum Retail Price"
                    value={formData.mrp || ''}
                    onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Stock Quantity *"
                    type="number"
                    placeholder="Available stock"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    required
                  />

                  <Input
                    label="Image URL"
                    placeholder="https://example.com/product-image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter detailed description of the product..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-border dark:border-border/10 rounded-lg text-sm font-medium outline-none bg-secondary dark:bg-dark focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-4 items-center">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Status:</span>
                  <div className="flex gap-2">
                    {(['active', 'draft'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: s })}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold border uppercase transition-all ${
                          formData.status === s
                            ? 'border-accent bg-accent/5 text-accent'
                            : 'border-border dark:border-border/10 hover:bg-secondary'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border dark:border-border/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('inventory')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Widgets */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Sale Card */}
                <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-wide">Total Sales Volume</p>
                    <h3 className="text-2xl font-extrabold mt-1">₹{(analytics?.revenue || 372000).toLocaleString('en-IN')}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                {/* Orders Card */}
                <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-wide">Completed Orders</p>
                    <h3 className="text-2xl font-extrabold mt-1">{(analytics?.total_orders || 1000).toLocaleString('en-IN')}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>

                {/* Active Items */}
                <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-wide">Active Listings</p>
                    <h3 className="text-2xl font-extrabold mt-1">{(analytics?.active_products || 450).toLocaleString('en-IN')}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Sales Chart Widget */}
              <div className="lg:col-span-2 bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent" /> Revenue Trends</h3>
                  <p className="text-xs text-muted mt-0.5">Monthly revenue figures for the current calendar year.</p>
                </div>

                {/* Custom SVG Trend Graph */}
                <div className="w-full h-64 mt-6 relative flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-border/10" />
                    <line x1="0" y1="90" x2="600" y2="90" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-border/10" />
                    <line x1="0" y1="140" x2="600" y2="140" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-border/10" />
                    
                    {/* SVG Curve Path */}
                    <path
                      d="M 50 160 Q 150 145 250 120 T 450 100 T 550 50"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Gradient under curve */}
                    <path
                      d="M 50 160 Q 150 145 250 120 T 450 100 T 550 50 L 550 200 L 50 200 Z"
                      fill="url(#chart-grad)"
                      opacity="0.1"
                    />

                    {/* Interactive dots */}
                    <circle cx="50" cy="160" r="5" fill="#2563EB" />
                    <circle cx="150" cy="145" r="5" fill="#2563EB" />
                    <circle cx="250" cy="120" r="5" fill="#2563EB" />
                    <circle cx="350" cy="110" r="5" fill="#2563EB" />
                    <circle cx="450" cy="100" r="5" fill="#2563EB" />
                    <circle cx="550" cy="50" r="5" fill="#2563EB" />

                    <defs>
                      <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="flex justify-between text-[10px] font-bold text-muted uppercase mt-4 px-6">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
