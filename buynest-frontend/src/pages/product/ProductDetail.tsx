import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Heart, Share2, Shield, RefreshCw, Truck,
  ChevronRight, ChevronLeft, Check, Star, ZapIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Rating } from '../../components/ui/Rating';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { ProductCard } from '../../components/product/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProduct, fetchProducts, products: similarProducts } = useProducts();
  const { addItem, isLoading: cartLoading } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('overview');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id).then(data => {
      setProduct(data);
      if (data?.category_id) {
        fetchProducts({ category: data.category_id, limit: 4 });
      }
      setLoading(false);
    });
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    await addItem(product.id, selectedVariant, quantity);
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl shimmer" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="aspect-square rounded-xl shimmer" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 shimmer rounded-lg w-3/4" />
            <div className="h-5 shimmer rounded-lg w-1/2" />
            <div className="h-10 shimmer rounded-lg w-1/3" />
            <div className="h-12 shimmer rounded-xl w-full mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-text dark:text-white">Product not found</h2>
        <Link to="/search" className="mt-4 inline-block text-accent hover:underline">Browse products</Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [{ url: '', is_primary: true }];
  const discount = product.discount_percent ?? Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted mb-6">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/search" className="hover:text-accent transition-colors">Products</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-text dark:text-white font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 mb-12">
          {/* Image Gallery */}
          <div className="space-y-3">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-border dark:border-white/10 group"
            >
              {images[selectedImage]?.url ? (
                <img
                  src={images[selectedImage].url}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <ShoppingCart className="w-24 h-24 opacity-10" />
                </div>
              )}

              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(i => Math.max(0, i - 1))}
                    disabled={selectedImage === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 glass rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(i => Math.min(images.length - 1, i + 1))}
                    disabled={selectedImage === images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 glass rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Discount chip */}
              {discount > 0 && (
                <div className="absolute top-4 left-4">
                  <Badge variant="danger" size="md">{discount}% OFF</Badge>
                </div>
              )}

              {/* Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => setWishlisted(!wishlisted)}
                  className="w-9 h-9 glass rounded-full flex items-center justify-center"
                >
                  <Heart className={`w-4 h-4 transition-colors ${wishlisted ? 'fill-danger text-danger' : 'text-muted'}`} />
                </button>
                <button className="w-9 h-9 glass rounded-full flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-muted" />
                </button>
              </div>
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-accent' : 'border-border dark:border-white/10 hover:border-accent/40'}`}
                  >
                    {img.url ? (
                      <img src={img.url} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full bg-secondary dark:bg-gray-800" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {product.seller?.store_name && (
              <p className="text-sm text-accent font-semibold">{product.seller.store_name}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-extrabold text-text dark:text-white leading-tight">{product.name}</h1>

            {product.rating > 0 && (
              <Rating value={product.rating} reviewCount={product.review_count} size="md" />
            )}

            {/* Pricing */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-mono font-extrabold text-4xl text-text dark:text-white">
                ₹{product.price?.toLocaleString('en-IN')}
              </span>
              {discount > 0 && (
                <>
                  <span className="font-mono text-xl text-muted line-through">
                    ₹{product.mrp?.toLocaleString('en-IN')}
                  </span>
                  <Badge variant="success" size="md">Save ₹{(product.mrp - product.price).toLocaleString('en-IN')}</Badge>
                </>
              )}
            </div>
            <p className="text-xs text-muted">MRP incl. all taxes</p>

            {/* Highlights */}
            {product.highlights?.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-sm text-text dark:text-white">Highlights</p>
                <ul className="space-y-1.5">
                  {product.highlights.slice(0, 5).map((h: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-sm text-text dark:text-white">Select Variant</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                        selectedVariant === v.id
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border dark:border-white/10 text-muted hover:border-accent/40'
                      } ${v.stock === 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                      disabled={v.stock === 0}
                    >
                      {v.name}: {v.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border dark:border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-12 flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5 transition-colors text-lg font-semibold text-muted"
                >
                  −
                </button>
                <span className="w-12 text-center font-bold text-text dark:text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock || 10, q + 1))}
                  className="w-10 h-12 flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5 transition-colors text-lg font-semibold text-muted"
                >
                  +
                </button>
              </div>
              <Button
                onClick={handleAddToCart}
                loading={adding || cartLoading}
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : (
                  <><ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart</>
                )}
              </Button>
            </div>

            {/* Delivery info */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'On orders ≥₹499' },
                { icon: RefreshCw, label: 'Easy Returns', sub: `${product.return_days || 7} days` },
                { icon: Shield, label: 'Secure Payment', sub: 'SSL encrypted' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="text-center p-3 bg-white dark:bg-gray-900 rounded-xl border border-border dark:border-white/10 space-y-1">
                  <Icon className="w-5 h-5 text-accent mx-auto" />
                  <p className="text-xs font-semibold text-text dark:text-white">{label}</p>
                  <p className="text-xs text-muted">{sub}</p>
                </div>
              ))}
            </div>

            {/* GST & COD */}
            <div className="flex gap-3 flex-wrap">
              <Badge variant="muted">GST: {product.gst_rate || 18}%</Badge>
              {product.is_cod && <Badge variant="success">COD Available</Badge>}
              {product.is_featured && <Badge variant="gold"><ZapIcon className="w-3 h-3 inline mr-1" />Featured</Badge>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border dark:border-white/10 overflow-hidden mb-12">
          <div className="flex border-b border-border dark:border-white/10">
            {(['overview', 'specs', 'reviews'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-muted hover:text-text dark:hover:text-white'
                }`}
              >
                {tab === 'reviews' ? `Reviews (${product.review_count || 0})` : tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted leading-relaxed">{product.description || 'No description available.'}</p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                {product.specifications?.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {product.specifications.map((spec: any, i: number) => (
                      <div key={i} className={`flex gap-2 px-4 py-3 rounded-xl text-sm ${i % 2 === 0 ? 'bg-secondary dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                        <span className="font-semibold text-text dark:text-white min-w-24 shrink-0">{spec.key}:</span>
                        <span className="text-muted">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No specifications available.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-8 text-muted">
                <Star className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-extrabold text-text dark:text-white mb-6">Similar Products</h2>
            <div className="product-grid">
              {similarProducts.slice(0, 4).filter(p => p.id !== product.id).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
