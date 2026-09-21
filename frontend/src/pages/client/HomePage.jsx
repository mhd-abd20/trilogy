import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import '../../styles/HomePage.css';

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const [promotions, setPromotions] = useState([]);
  const [selectedPromoId, setSelectedPromoId] = useState(null);
  const [promosLoading, setPromosLoading] = useState(true);

  const sliderRef = useRef(null);
  const promoSliderRef = useRef(null);

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
        console.error("خطأ في جلب بيانات المنتجات في الصفحة الرئيسية:", err);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchPromotions = async () => {
      try {
        setPromosLoading(true);
        const res = await axios.get(`${SERVER_ORIGIN}/api/promotions/active`);
        const activePromos = Array.isArray(res.data) ? res.data : [];

        // جلب المنتجات المرتبطة بكل عرض نشط
        const promosWithProducts = await Promise.all(
          activePromos.map(async (promo) => {
            try {
              const pRes = await axios.get(`${SERVER_ORIGIN}/api/promotions/${promo.id}`);
              return {
                ...promo,
                products: Array.isArray(pRes.data) ? pRes.data : []
              };
            } catch (e) {
              return { ...promo, products: [] };
            }
          })
        );

        setPromotions(promosWithProducts);
        if (promosWithProducts.length > 0) {
          const firstWithProducts = promosWithProducts.find(p => p.products.length > 0) || promosWithProducts[0];
          setSelectedPromoId(firstWithProducts ? String(firstWithProducts.id) : null);
        }
      } catch (err) {
        console.error("خطأ في جلب العروض في الصفحة الرئيسية:", err);
        setPromotions([]);
      } finally {
        setPromosLoading(false);
      }
    };

    fetchData();
    fetchPromotions();
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
      return <p className="stock-info in-stock">الكمية: {stock} (متوفرة)</p>;
    } else if (stock <= 10 && stock > 0) {
      return <p className="stock-info limited-stock">الكمية: {stock} (كمية محدودة)</p>;
    } else {
      return <p className="stock-info out-stock">الكمية: {stock} (غير متوفرة)</p>;
    }
  };

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
    setCart(updatedCart);

   
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new CustomEvent('cartBadgeUpdated'));
  };

  const filteredProducts = products.filter((product) => {
    const prodName = (product.name || product.product_name || '').toLowerCase();
    const matchesSearch = prodName.includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' ||
      String(product.category_id) === String(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    const scrollAmount = 300;
   
    if (direction === 'left') {
      sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollPromoSlider = (direction) => {
    if (!promoSliderRef.current) return;
    const scrollAmount = 300;
    if (direction === 'left') {
      promoSliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      promoSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="home-wrapper">
    
      <section className="hero-card">
        <div className="badge">✨ أحدث المنتجات والتخفيضات 2026</div>
        <h1>مرحباً بكم في <span className="highlight-text">Trilogy</span></h1>
        <p className="hero-desc">
          كل ما تحتاجونه تجدوه هنا — عالم متكامل من المنتجات المختارة بعناية لتجربة تسوق فريدة وعصرية.
        </p>

        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary">
            تصفح المنتجات الآن
          </Link>
          {localStorage.getItem('userId') ? (
            <Link to="/promotions" className="btn btn-secondary">
              اخر العروضات
            </Link>
          ) : (
            <Link to="/register" className="btn btn-secondary">
              إنشاء حساب جديد
            </Link>
          )}
        </div>
      </section>

      {/* قسم آخر المنتجات - شريط عرض أفقي متكامل */}
      <section className="latest-products-section">
        <div className="section-header">
          <div className="header-titles">
            <span className="section-badge">🔥 تشكيلة حصرية</span>
            <h3 className="section-title" >أحدث المنتجات</h3>
            <p className="section-subtitle">تصفح تشكيلة منتجاتنا المتنوعة وأحدث ما وصلنا</p>
          </div>
          <div className="header-actions">
            <Link to="/products" className="view-all-link">
              عرض كافة المنتجات ←
            </Link>
            <div className="slider-nav-buttons">
              <button 
                type="button" 
                className="slider-arrow-btn" 
                onClick={() => scrollSlider('right')} 
                title="السابق"
                aria-label="السابق"
              >
                <FiChevronRight size={22} />
              </button>
              <button 
                type="button" 
                className="slider-arrow-btn" 
                onClick={() => scrollSlider('left')} 
                title="التالي"
                aria-label="التالي"
              >
                <FiChevronLeft size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* فلاتر البحث والفئات */}
        <div className="home-filter-container">
          <div className="home-search-box">
            <FiSearch className="search-icon" size={18} />
            <input
              type="text"
              className="home-search-input"
              placeholder="ابحث بالاسم عن أي منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="home-category-pills">
            <button
              type="button"
              className={`home-cat-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              الكل ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter(p => String(p.category_id) === String(cat.id)).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`home-cat-pill ${selectedCategory === String(cat.id) ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(String(cat.id))}
                >
                  {cat.name} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* حالة التحميل أو عرض شريط المنتجات */}
        {loading ? (
          <div className="slider-loading">
            <div className="loading-spinner"></div>
            <span>جاري تحميل أحدث المنتجات...</span>
          </div>
        ) : (
          <div className="slider-container-wrapper">
            <button 
              type="button" 
              className="floating-arrow-btn floating-right" 
              onClick={() => scrollSlider('right')} 
              aria-label="السابق"
            >
              <FiChevronRight size={24} />
            </button>

            <div className="horizontal-products-slider" ref={sliderRef}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const pId = product.id || product.product_id;
                  const isOutOfStock = product.stock_quantity <= 0;
                  const isInCart = cart.some((item) => String(item.id || item.product_id) === String(pId));
                  const hasDiscount = product.promo_price !== null && product.promo_price !== undefined;
                  const originalPrice = product.original_price || product.price;

                  const selectedQty = getSelectedQty(pId);

                  return (
                    <div key={pId} className={`horizontal-product-card ${isInCart ? 'in-cart' : ''}`}>
                      {isInCart && (
                        <span className="card-badge in-cart-tag">
                          في السلة ✓
                        </span>
                      )}
                      {hasDiscount && (
                        <div className="card-discount-tag">
                          خصم {product.discount_percentage}%
                        </div>
                      )}

                      <Link to={`/products/${pId}`} className="card-image-anchor">
                        <div className="card-image-box">
                          <img
                            src={getImageUrl(product.image_url)}
                            alt={product.name || product.product_name}
                            loading="lazy"
                          />
                        </div>
                      </Link>

                      <div className="card-content">
                        <Link to={`/products/${pId}`} className="card-title-link">
                          <h3 title={product.name || product.product_name}>
                            {product.name || product.product_name}
                          </h3>
                        </Link>

                        {stockStatus(product.stock_quantity)}

                        <div className="card-price-row">
                          {hasDiscount ? (
                            <>
                              <span className="card-promo-price">
                                ${product.promo_price}
                              </span>
                              <span className="card-original-price">
                                ${originalPrice}
                              </span>
                            </>
                          ) : (
                            <span className="card-main-price">
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

                        <div className="card-actions-row">
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock}
                            className="card-btn-cart"
                          >
                            {isOutOfStock ? 'نفذت الكمية ❌' : `إضافة (${selectedQty}) 🛒`}
                          </button>

                          <Link
                            to={`/products/${pId}`}
                            className="card-btn-details"
                          >
                            التفاصيل
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-slider-state">
                  <span className="empty-icon">🔍</span>
                  <h4>لا توجد منتجات تطابق بحثك</h4>
                  <p>جرب تغيير كلمة البحث أو اختيار تصنيف آخر</p>
                  <button 
                    type="button" 
                    className="btn-reset-filters" 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                  >
                    إعادة ضبط الفلاتر
                  </button>
                </div>
              )}
            </div>

            <button 
              type="button" 
              className="floating-arrow-btn floating-left" 
              onClick={() => scrollSlider('left')} 
              aria-label="التالي"
            >
              <FiChevronLeft size={24} />
            </button>
          </div>
        )}
      </section>

      {/* قسم العروض والتخفيضات الترويجية الحصرية */}
      {promotions.length > 0 && (() => {
        const activePromotion = promotions.find(p => String(p.id) === String(selectedPromoId)) || promotions[0];
        const promoProducts = activePromotion ? activePromotion.products : [];

        return (
          <section className="promotions-section">
            <div className="section-header promo-header">
              <div className="header-titles">
                <span className="section-badge promo-badge-glow">🔥 صفقات لا تُفوّت</span>
                <h3 className="section-title">أقوى العروض والتخفيضات</h3>
                <p className="section-subtitle">وفر أكثر مع عروضنا الترويجية الحصرية والخصومات المحدودة</p>
              </div>
              <div className="header-actions">
                <Link to="/promotions" className="view-all-link promo-view-all">
                  استعراض كافة العروض ←
                </Link>
                <div className="slider-nav-buttons">
                  <button 
                    type="button" 
                    className="slider-arrow-btn promo-arrow" 
                    onClick={() => scrollPromoSlider('right')} 
                    title="السابق"
                    aria-label="السابق"
                  >
                    <FiChevronRight size={22} />
                  </button>
                  <button 
                    type="button" 
                    className="slider-arrow-btn promo-arrow" 
                    onClick={() => scrollPromoSlider('left')} 
                    title="التالي"
                    aria-label="التالي"
                  >
                    <FiChevronLeft size={22} />
                  </button>
                </div>
              </div>
            </div>

            {/* أزرار اختيار العرض (Tabs) */}
            <div className="promo-tabs-container">
              {promotions.map((promo) => (
                <button
                  key={promo.id}
                  type="button"
                  className={`promo-tab-btn ${String(activePromotion?.id) === String(promo.id) ? 'active' : ''}`}
                  onClick={() => setSelectedPromoId(String(promo.id))}
                >
                  <span className="tab-icon">🏷️</span>
                  <span className="tab-title">{promo.title}</span>
                  <span className="tab-count">{promo.products?.length || 0} منتج</span>
                </button>
              ))}
            </div>

            {/* بطاقة تفاصيل العرض المختار */}
            {activePromotion && (
              <div className="active-promo-banner">
                <div className="promo-banner-info">
                  <div className="promo-banner-heading">
                    <span className="promo-flame-icon">🔥</span>
                    <h3>{activePromotion.title}</h3>
                  </div>
                  <div className="promo-banner-dates">
                    <span className="calendar-icon">📅</span>
                    <span>
                      ينتهي في: {new Date(activePromotion.end_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <Link to={`/promotions/${activePromotion.id}`} className="btn-promo-details-banner">
                  استعرض صفحة العرض بالكامل 👈
                </Link>
              </div>
            )}

            {/* شريط منتجات العرض المختار */}
            {promosLoading ? (
              <div className="slider-loading">
                <div className="loading-spinner"></div>
                <span>جاري تحميل منتجات العرض...</span>
              </div>
            ) : (
              <div className="slider-container-wrapper">
                <button 
                  type="button" 
                  className="floating-arrow-btn floating-right" 
                  onClick={() => scrollPromoSlider('right')} 
                  aria-label="السابق"
                >
                  <FiChevronRight size={24} />
                </button>

                <div className="horizontal-products-slider promo-slider" ref={promoSliderRef}>
                  {promoProducts && promoProducts.length > 0 ? (
                    promoProducts.map((product) => {
                      const pId = product.id || product.product_id;
                      const isOutOfStock = product.stock_quantity <= 0;
                      const isInCart = cart.some((item) => (item.id || item.product_id) === pId);
                      const selectedQty = getSelectedQty(pId);
                      const originalPrice = product.original_price || product.price;

                      return (
                        <div key={pId} className={`horizontal-product-card promo-product-card ${isInCart ? 'in-cart' : ''}`}>
                          {isInCart && (
                            <span className="card-badge in-cart-tag">
                              في السلة ✓
                            </span>
                          )}
                          <div className="card-discount-tag promo-fire-tag">
                            خصم {product.discount_percentage}% 🔥
                          </div>

                          <Link to={`/products/${pId}`} className="card-image-anchor">
                            <div className="card-image-box">
                              <img
                                src={getImageUrl(product.image_url)}
                                alt={product.name || product.product_name}
                                loading="lazy"
                              />
                            </div>
                          </Link>

                          <div className="card-content">
                            {product.cname && (
                              <span className="promo-cat-badge">{product.cname}</span>
                            )}

                            <Link to={`/products/${pId}`} className="card-title-link">
                              <h3 title={product.name || product.product_name}>
                                {product.name || product.product_name}
                              </h3>
                            </Link>

                            {stockStatus(product.stock_quantity)}

                            <div className="card-price-row">
                              <span className="card-promo-price">
                                ${product.promo_price}
                              </span>
                              <span className="card-original-price">
                                ${originalPrice}
                              </span>
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

                            <div className="card-actions-row">
                              <button
                                type="button"
                                onClick={() => addToCart(product)}
                                disabled={isOutOfStock}
                                className="card-btn-cart promo-btn-cart"
                              >
                                {isOutOfStock ? 'نفذت الكمية ❌' : `إضافة (${selectedQty}) 🛒`}
                              </button>

                              <Link
                                to={`/products/${pId}`}
                                className="card-btn-details"
                              >
                                التفاصيل
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-slider-state promo-empty-state">
                      <span className="empty-icon">🎁</span>
                      <h4>لا توجد منتجات مضافة لهذا العرض حالياً</h4>
                      <p>تفقّد باقي العروض الأخرى أعلاه لتصفح منتجاتها المخفضة</p>
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  className="floating-arrow-btn floating-left" 
                  onClick={() => scrollPromoSlider('left')} 
                  aria-label="التالي"
                >
                  <FiChevronLeft size={24} />
                </button>
              </div>
            )}
          </section>
        );
      })()}

      <section className="features-container">
        <div className="feature-card">
          <div className="icon-wrapper">🚀</div>
          <h3>توصيل سريع</h3>
          <p>شحن سريع ومباشر لجميع المناطق خلال وقت قياسي</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper">💎</div>
          <h3>جودة عالية</h3>
          <p>منتجات مضمونة 100% ومختارة بعناية فائقة</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper">🔒</div>
          <h3>دفع آمن</h3>
          <p>معاملاتك المالية محمية ببروتوكولات أمان عالية</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper">⚡</div>
          <h3>دعم فوري</h3>
          <p>فريقنا جاهز للرد على جميع استفساراتك على مدار الساعة</p>
        </div>
      </section>

      <section className="cta-wrapper">
        {localStorage.getItem("userId") ? (
          <div className="cta-inner">
            <h2>تتبع عمليات الشراء </h2>
            <p>بإنشائك حساب في متجرنا يمكن تتبع جميع عمليات الشراء التي تقوم بها وتلقي اشعارات لكل عروضاتنا الجديدة</p>
            <Link to="/order-history" className="btn btn-cta"> مشترياتي</Link>
          </div>
        ) : (
          <div className="cta-inner">
            <h2>جاهز لبدء تجربتك مع Trilogy؟</h2>
            <p>انضم إلى مجتمعنا وسجّل حسابك لتتمكن من حفظ سلة الشراء ومتابعة الطلبات بكل سهولة.</p>
            <Link to="/login" className="btn btn-cta">تسجيل الدخول</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
