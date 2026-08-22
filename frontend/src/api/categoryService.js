import { customFetch } from './fetchClient';


export const getCategories = async () => {
  return await customFetch('/categories');
};


export const createCategory = async (name, isActive = true) => {
  return await customFetch('/categories', {
    method: 'POST',
    body: JSON.stringify({ name, is_active: isActive }),
  });
};


export const updateCategory = async (id, name, isActive) => {
  return await customFetch(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, is_active: isActive }),
  });
};