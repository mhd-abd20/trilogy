import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PromotionDetails = () => {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${SERVER_ORIGIN}${cleanPath}`;
  };

  useEffect(() => {
    const fetchPromoProducts = async () => {
      try {
        setLoading(true);
       
        const res = await axios.get(`${SERVER_ORIGIN}/api/promotions/${id}`);
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('خطأ في جلب منتجات العرض:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoProducts();
  }, [id]);

  if (loading) return <div className="loading-state">جاري تحميل منتجات العرض...</div>;

  return (
    <div className="promo-details-container" style={{ padding: '20px' }}>
      <Link to="/promotions" style={{ textDecoration: 'none', color: '#3182ce' }}>
        ← العودة لكافة العروض
      </Link>

      <h2 style={{ marginTop: '15px' }}>منتجات العرض</h2>

      {products.length === 0 ? (
        <p>لا توجد منتجات مرتبطة بهذا العرض.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#e53e3e', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                خصم {product.discount_percentage}%
              </span>

              <div className="product-image-wrapper">
                <img src={getImageUrl(product.image_url)} alt={product.name} style={{ width: '100%', height: '180px', objectFit: 'contain' }} />
              </div>

              <h3>{product.name}</h3>
              <p style={{ color: '#718096', fontSize: '14px' }}>الفئة: {product.cname}</p>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '10px 0' }}>
                <span style={{ color: '#e53e3e', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  ${product.promo_price}
                </span>
                <span style={{ textDecoration: 'line-through', color: '#a0aec0', fontSize: '0.9rem' }}>
                  ${product.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromotionDetails;