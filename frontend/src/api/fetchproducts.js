import { customFetch } from './fetchClient';
import axios from 'axios';

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;
// جلب جميع المنتجات
export const getProducts = async (page = 1, limit = 100) => {
  return await customFetch(`/products?page=${page}&limit=${limit}`);
};

// جلب منتج حسب الـ ID
export const getProductById = async (id) => {
  return await customFetch(`/products/${id}`);
};

// إضافة منتج جديد (يستقبل FormData للصور)
export const createProduct = async (formData) => {
  return await customFetch('/products', {
    method: 'POST',
    body: formData,
  });
};

export const createBulkProducts = async (productsArray) => {
  const response = await axios.post(`${SERVER_ORIGIN}/api/products/bulk`, {
    products: productsArray
  });
  return response.data;
};

// تعديل منتج (يستقبل FormData للصور)
export const updateProduct = async (id, formData) => {
  return await customFetch(`/products/${id}`, {
    method: 'PUT',
    body: formData,
  });
};

// حذف منتج
export const deleteProduct = async (id) => {
  return await customFetch(`/products/${id}`, {
    method: 'DELETE',
  });
};