import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/products.css';
const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;
const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('trilogy_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${SERVER_ORIGIN}/api/products`),
          axios.get(`${SERVER_ORIGIN}/api/categories`)
        ]);

        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const syncCart = () => {
      try {
        const saved = localStorage.getItem('trilogy_cart');
        setCart(saved ? JSON.parse(saved) : []);
      } catch {
        setCart([]);
      }
    };

    window.addEventListener('cartUpdated', syncCart);
    window.addEventListener('storage', syncCart);

    return () => {
      window.removeEventListener('cartUpdated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (
      imagePath.startsWith('http://') ||
      imagePath.startsWith('https://') ||
      imagePath.startsWith('data:')
    ) {
      return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${SERVER_ORIGIN}${cleanPath}`;
  };

  const stockStatus = (stock) => {
    if (stock > 10) {
      return (
        <p style={{ color: "green" }}>الكمية: {stock} (متوفرة)</p>
      )
    }
    else if (stock < 10 && stock > 0) {
      return (
        <p style={{ color: "#FFD700" }}>الكمية: {stock} (كمية محدودة)</p>
      )
    }
    else {
      return (
        <p style={{ color: "red" }}>الكمية: {stock} (غير متوفرة)</p>
      )
    }
  }


  const [quantities, setQuantities] = useState({});

  const getSelectedQty = (pId) => quantities[pId] || 1;

  const handleQtyChange = (pId, delta, maxStock) => {
    setQuantities((prev) => {
      const current = prev[pId] || 1;
      const next = current + delta;
      if (next < 1) return prev;
      if (next > maxStock) {
        alert(`عذراً، أقصى كمية متوفرة في المخزون هي ${maxStock}`);
        return prev;
      }
      return { ...prev, [pId]: next };
    });
  };

  const addToCart = (product) => {
    const prodId = product.id || product.product_id;
    const qtyToAdd = quantities[prodId] || 1;
    const effectivePrice =
      product.promo_price !== null && product.promo_price !== undefined
        ? Number(product.promo_price)
        : Number(product.price || product.original_price);


    const currentCart = JSON.parse(localStorage.getItem('trilogy_cart') || '[]');

    const existing = currentCart.find((item) => String(item.id || item.product_id) === String(prodId));
    const currentQty = existing ? existing.quantity : 0;
    const maxStock = product.stock_quantity ?? product.stock ?? Infinity;


    if (currentQty + qtyToAdd > maxStock) {
      alert(`عذراً، المتوفر في المخزون فقط ${maxStock} قطعة (لديك بالفعل ${currentQty} في السلة)`);
      return;
    }

    let updatedCart;
    if (existing) {
      updatedCart = currentCart.map((item) =>
        String(item.id || item.product_id) === String(prodId)
          ? { ...item, quantity: item.quantity + qtyToAdd, price: effectivePrice }
          : item
      );
    } else {
      updatedCart = [
        ...currentCart,
        { ...product, id: prodId, price: effectivePrice, quantity: qtyToAdd },
      ];
    }

    localStorage.setItem('trilogy_cart', JSON.stringify(updatedCart));
    if (typeof setCart === 'function') {
      setCart(updatedCart);
    }

    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new CustomEvent('cartBadgeUpdated'));


  };

  const filteredProducts = products.filter((product) => {
    const prodName = (product.name || product.product_name || '').toLowerCase();
    const matchesSearch = prodName.includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' ||
      String(product.category_id) === String(selectedCategory);

    const stock = Number(product.stock_quantity ?? product.stock ?? 0);
    const matchesStock = !inStockOnly || stock > 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const cartBadgeCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="products-container">
      <div className="products-header">
        <h2>معرض المنتجات</h2>

      </div>

      <div className="filter-section">
        <input
          type="text"
          className="search-input"
          placeholder="ابحث عن منتج بالاسم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        

        <div className="category-buttons">
          <button
            className={`cat-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn ${selectedCategory === String(cat.id) ? 'active' : ''}`}
              onClick={() => setSelectedCategory(String(cat.id))}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
  <input
    type="checkbox"
    checked={inStockOnly}
    onChange={(e) => setInStockOnly(e.target.checked)}
  />
  <span>عرض المتوفر في المخزون فقط</span>
</label>
      </div>

      {loading ? (
        <div className="loading-state">جاري تحميل المنتجات...</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const pId = product.id || product.product_id;
              const isOutOfStock = product.stock_quantity <= 0;
              const isInCart = cart.some(
                (item) => String(item.id || item.product_id) === String(pId)
              );
              const selectedQty = getSelectedQty(pId);
              const hasDiscount = product.promo_price !== null && product.promo_price !== undefined;
              const originalPrice = product.original_price || product.price;

              return (
                <div key={pId} className="product-card" style={{ position: 'relative' }}>
                  {isInCart && (
                    <span className="in-cart-badge">
                      في السلة ✓
                    </span>
                  )}
                  {hasDiscount && (
                    <div className="badge-container" style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 1 }}>
                      <span className="discount-badge" style={{ backgroundColor: '#e53e3e', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        خصم {product.discount_percentage}%
                      </span>
                    </div>
                  )}

                  <div className="product-image-wrapper">
                    <img
                      src={getImageUrl(product.image_url)}
                      alt={product.name || product.product_name}
                    />
                  </div>

                  <h3>{product.name || product.product_name}</h3>

                  {stockStatus(product.stock_quantity)}
                  <div className="product-price-wrapper" style={{ margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {hasDiscount ? (
                      <>
                        <span className="promo-price" style={{ color: '#e53e3e', fontWeight: 'bold', fontSize: '1.2rem' }}>
                          ${product.promo_price}
                        </span>
                        <span className="original-price" style={{ textDecoration: 'line-through', color: '#a0aec0', fontSize: '0.9rem' }}>
                          ${originalPrice}
                        </span>
                      </>
                    ) : (
                      <span className="product-price" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        ${originalPrice}
                      </span>
                    )}
                  </div>

                  {!isOutOfStock && (
                    <div className="card-qty-row">
                      <span className="qty-label">الكمية:</span>
                      <div className="card-qty-picker">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(pId, -1, product.stock_quantity)}
                          disabled={selectedQty <= 1}
                          title="تقليل الكمية"
                        >
                          -
                        </button>
                        <span className="qty-value">{selectedQty}</span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(pId, 1, product.stock_quantity)}
                          disabled={selectedQty >= product.stock_quantity}
                          title="زيادة الكمية"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="buttons" style={{ display: 'flex', flexDirection: 'row', gap: '8px', width: '100%', marginTop: '12px', boxSizing: 'border-box' }}>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className="btn-add-cart"
                      style={{
                        flex: '2 1 0%',
                        minWidth: 0,
                        padding: '10px 4px',
                        backgroundColor: isOutOfStock ? '#94a3b8' : 'var(--primary-color, #2563eb)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {isOutOfStock ? 'نفذت الكمية ❌' : `إضافة (${selectedQty}) 🛒`}
                    </button>

                    <Link
                      to={`/products/${pId}`}
                      className="btn-details"
                      style={{
                        flex: '1 1 0%',
                        minWidth: 0,
                        padding: '10px 4px',
                        backgroundColor: '#475569',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap',
                        boxSizing: 'border-box'
                      }}
                    >
                      التفاصيل
                    </Link>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="no-results">لا توجد منتجات تطابق البحث</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Products;