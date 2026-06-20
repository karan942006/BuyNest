import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useProducts } from '../../hooks/useProducts';

const SORT_OPTIONS = [
  { label: 'Best Sellers', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Newest First', value: 'newest' },
];

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹2,000', min: 500, max: 2000 },
  { label: '₹2,000 - ₹10,000', min: 2000, max: 10000 },
  { label: '₹10,000 - ₹50,000', min: 10000, max: 50000 },
  { label: 'Above ₹50,000', min: 50000, max: 9999999 },
];

const ProductList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  
  const { products, loading, pagination, fetchProducts, categories, fetchCategories } = useProducts();
  const [sort, setSort] = useState('popular');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedPriceRange, setSelectedPriceRange] = useState<typeof PRICE_RANGES[0] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const doFetch = useCallback(() => {
    fetchProducts({
      search: queryParam,
      category: selectedCategory,
      minPrice: selectedPriceRange?.min,
      maxPrice: selectedPriceRange?.max,
      sort,
      page,
      limit: 20,
    });
  }, [queryParam, selectedCategory, selectedPriceRange, sort, page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [queryParam, selectedCategory, selectedPriceRange, sort]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPriceRange(null);
    setSort('popular');
  };

  const hasActiveFilters = selectedCategory || selectedPriceRange || sort !== 'popular';

  const FilterPanel = () => (
    <div className="space-y-6">
      {hasActiveFilters && (
        <button onClick={clearFilters} className="text-xs text-accent hover:underline flex items-center gap-1">
          <X className="w-3 h-3" /> Clear all filters
        </button>
      )}

      {/* Categories */}
      <div>
        <p className="font-bold text-sm text-text dark:text-white mb-3">Category</p>
        <div className="space-y-1.5">
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-muted hover:bg-secondary dark:hover:bg-white/5 hover:text-text dark:hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p className="font-bold text-sm text-text dark:text-white mb-3">Price Range</p>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setSelectedPriceRange(selectedPriceRange?.label === range.label ? null : range)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                selectedPriceRange?.label === range.label
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-muted hover:bg-secondary dark:hover:bg-white/5 hover:text-text dark:hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text dark:text-white">
              {queryParam ? `Results for "${queryParam}"` : selectedCategory ? categories.find((c: any) => c.id === selectedCategory)?.name || 'Products' : 'All Products'}
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {loading ? 'Loading...' : `${pagination.total} products found`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile Filter toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-border dark:border-white/10 rounded-xl text-sm font-medium text-text dark:text-white"
            >
              <Filter className="w-4 h-4" />
              Filters {hasActiveFilters && <span className="w-2 h-2 bg-accent rounded-full" />}
            </button>
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-900 border border-border dark:border-white/10 rounded-xl px-4 pr-9 py-2 text-sm font-medium text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filter (desktop) */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="sticky top-32 bg-white dark:bg-gray-900 rounded-2xl border border-border dark:border-white/10 p-5">
              <h2 className="font-bold text-text dark:text-white mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h2>
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile Filter Drawer */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 md:hidden"
              >
                <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 p-5 overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="font-bold text-text dark:text-white">Filters</h2>
                    <button onClick={() => setFiltersOpen(false)}>
                      <X className="w-5 h-5 text-muted" />
                    </button>
                  </div>
                  <FilterPanel />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="product-grid">
                {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Search className="w-16 h-16 text-muted opacity-20" />
                <p className="text-xl font-bold text-text dark:text-white">No products found</p>
                <p className="text-muted text-sm">Try adjusting your search or filters</p>
                <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted">
                      Page {page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
