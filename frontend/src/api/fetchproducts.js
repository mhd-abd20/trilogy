import { customFetch } from './fetchClient';

// جلب جميع المنتجات
export const getProducts = async () => {
  return await customFetch('/products');
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