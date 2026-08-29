import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/product-details.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${SERVER_ORIGIN}/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("خطأ في جلب تفاصيل المنتج:", err);
        setError("تعذر تحميل تفاصيل المنتج. قد يكون غير موجود.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = null;

    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v');
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${SERVER_ORIGIN}${cleanPath}`;
  };

  const addToCart = () => {
    if (!product) return;
    const prodId = product.id || product.product_id;
    const effectivePrice = product.promo_price !== null && product.promo_price !== undefined
      ? Number(product.promo_price)
      : Number(product.price || product.original_price);

    const savedCart = JSON.parse(localStorage.getItem('trilogy_cart') || '[]');
    const existingIndex = savedCart.findIndex((item) => (item.id || item.product_id) === prodId);
    const currentQty = existingIndex > -1 ? savedCart[existingIndex].quantity : 0;

    if (currentQty + quantity > product.stock_quantity) {
      alert(`عذراً، المتبقي في المخزون فقط ${product.stock_quantity} قطعة.`);
      return;
    }

    if (existingIndex > -1) {
      savedCart[existingIndex].quantity += quantity;
    } else {
      savedCart.push({ ...product, id: prodId, price: effectivePrice, quantity });
    }

    localStorage.setItem('trilogy_cart', JSON.stringify(savedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    
  };

  if (loading) return <div className="details-loading">جاري تحميل تفاصيل المنتج...</div>;
  if (error || !product) {
    return (
      <div className="details-error">
        <p>{error || 'المنتج غير موجود'}</p>
        <button onClick={() => navigate('/products')} className="btn-back">العودة للمتجر</button>
      </div>
    );
  }

  const pId = product.id || product.product_id;
  const isOutOfStock = product.stock_quantity <= 0;
  const hasDiscount = product.promo_price !== null && product.promo_price !== undefined;
  const originalPrice = product.original_price || product.price;
  const effectivePrice = hasDiscount ? product.promo_price : originalPrice;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(product.youtube_url || product.video_url);

  return (
    <div className="product-details-container">
      <button onClick={() => navigate(-1)} className="btn-back">
        ➡️ العودة
      </button>

      <div className="details-main-grid">
       
        <div className="details-media-section">
          <div className="details-image-wrapper">
            {hasDiscount && (
              <span className="details-discount-badge">
                خصم {product.discount_percentage}%
              </span>
            )}
            <img
              src={getImageUrl(product.image_url)}
              alt={product.name || product.product_name}
            />
          </div>
        </div>

       
        <div className="details-info-section">
          <span className="details-category-tag">
            {product.category_name || product.category || 'تصنيف عام'}
          </span>
          <h1 className="details-title">{product.name || product.product_name}</h1>

          <div className="details-price-row">
            {hasDiscount ? (
              <>
                <span className="details-promo-price">${effectivePrice}</span>
                <span className="details-original-price">${originalPrice}</span>
              </>
            ) : (
              <span className="details-price">${originalPrice}</span>
            )}
          </div>

          <div className="details-meta-list">
            <div className="meta-item">
              <strong>معرّف المنتج (ID):</strong> <span>#{pId}</span>
            </div>
            <div className="meta-item">
              <strong>حالة المخزون:</strong> 
              <span className={isOutOfStock ? 'stock-out' : 'stock-in'}>
                {isOutOfStock ? 'نفذت الكمية ❌' : `متوفر (${product.stock_quantity} قطعة) ✅`}
              </span>
            </div>
          </div>

          <div className="details-description">
            <h3>الوصف:</h3>
            <p>{product.description || 'لا يوجد وصف متاح لهذا المنتج حالياً.'}</p>
          </div>

          {!isOutOfStock && (
            <div className="details-purchase-controls">
              <div className="quantity-selector">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}>+</button>
              </div>

              <button onClick={addToCart} className="btn-add-to-cart-large">
                إضافة للسلة 🛒
              </button>
            </div>
          )}
        </div>
      </div>

      
      {youtubeEmbedUrl && (
        <div className="details-video-section">
          <h2>مقطع توضيحي عن المنتج 🎬</h2>
          <div className="video-responsive-wrapper">
            <iframe
              src={youtubeEmbedUrl}
              title={`فيديو ${product.name || product.product_name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;