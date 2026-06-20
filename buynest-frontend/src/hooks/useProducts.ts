import { useState, useCallback } from 'react';
import api from '../services/api';

export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

  const fetchProducts = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/products', { params: filters });
      setProducts(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  }, []);

  const getProduct = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Get product error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    categories,
    loading,
    pagination,
    fetchProducts,
    fetchCategories,
    getProduct,
  };
};

export default useProducts;
