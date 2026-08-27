import { customFetch } from './fetchClient';

export const getPromotions = async () => {
  return await customFetch('/promotions');
};
export const getPromotions_id = async (id) =>{
  return await customFetch(`/promotions/${id}`)
}

export const createPromotion = async (promoData) => {
  return await customFetch('/promotions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(promoData),
  });
};

export const togglePromotionActive = async (id, isActive) => {
  return await customFetch(`/promotions/${id}/toggle-active`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive ? 1 : 0 }),
  });
};
export const deletePromotion = async (id) => {
 return await customFetch(`/promotions/${id}`, {
    method: 'DELETE',
  });
};
export const addProductToPromotion = async (promotionId, productId, discountPercentage) => {
 
  return await customFetch(`/promotions/${promotionId}/products`, {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      discount_percentage: discountPercentage,
    }),
  });
};


export const removeProductFromPromotion = async (promotionId, productId) => {
  return await customFetch(`/promotions/${promotionId}/products/${productId}`, {
    method: 'DELETE',
  });
};