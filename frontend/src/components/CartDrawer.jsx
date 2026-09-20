import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/CartPage.css';

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;

const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('trilogy_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 
  useEffect(() => {
    const handleOpen = () => {
     
      try {
        const saved = localStorage.getItem('trilogy_cart');
        if (saved) setCart(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
      setIsOpen(true);
    };

    const handleClose = () => setIsOpen(false);

    const handleCartSync = () => {
      try {
        const saved = localStorage.getItem('trilogy_cart');
        setCart(saved ? JSON.parse(saved) : []);
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('openCartDrawer', handleOpen);
    window.addEventListener('closeCartDrawer', handleClose);
    window.addEventListener('cartUpdated', handleCartSync);

    return () => {
      window.removeEventListener('openCartDrawer', handleOpen);
      window.removeEventListener('closeCartDrawer', handleClose);
      window.removeEventListener('cartUpdated', handleCartSync);
    };
  }, []);

const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('trilogy_cart', JSON.stringify(newCart));

  
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new CustomEvent('cartBadgeUpdated'));
  };

  const closeDrawer = () => setIsOpen(false);

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

  const updateQuantity = (id, delta) => {
    const updated = cart
      .map((item) => {
        const itemId = item.id || item.product_id;
        if (itemId === id) {
          const maxStock = item.stock ?? item.stock_quantity ?? Infinity;
          const newQty = item.quantity + delta;

          if (delta > 0 && newQty > maxStock) {
            alert(`عذراً، أقصى كمية متوفرة في المخزون هي ${maxStock}`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    saveCart(updated);
  };

  const removeItem = (id) => {
    const updated = cart.filter((item) => (item.id || item.product_id) !== id);
    saveCart(updated);
  };

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const guestNavigate = () => {
    if (cart.length === 0) return;
    const payload = {
      items: cart.map((item) => ({
        productId: item.id || item.product_id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      totalAmount: totalPrice,
    };
    closeDrawer();
    navigate('/guest-checkout', { state: { payload } });
  };

const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const storedUserId = localStorage.getItem('userId');
      const payload = {
        userId: storedUserId || null,
        items: cart.map((item) => ({
          productId: item.id || item.product_id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        totalAmount: totalPrice.toFixed(2),
      };
      await axios.post(`${SERVER_ORIGIN}/api/orders/checkout`, payload);
      alert('تم إرسال الطلب بنجاح وتحديث المخزون!');
      saveCart([]); 
      closeDrawer();
      navigate('/products');
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={closeDrawer}>
      <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h3>سلة التسوق ({cart.length})</h3>
          <button className="cart-drawer-close" onClick={closeDrawer}>✕</button>
        </div>

        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="empty-cart-drawer">
              <p>السلة فارغة حالياً</p>
              <button
                className="btn-shop"
                onClick={() => {
                  closeDrawer();
                  navigate('/products');
                }}
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <div className="cart-drawer-items">
              {cart.map((item) => {
                const itemId = item.id || item.product_id;
                const isMax = item.quantity >= (item.stock ?? item.stock_quantity ?? Infinity);
                return (
                  <div key={itemId} className="cart-drawer-item">
                    <div className="cart-item-img-wrapper">
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.name || item.product_name}
                      />
                    </div>

                    <div className="cart-item-details">
                      <h4>{item.name || item.product_name}</h4>
                      <p className="cart-item-price">${item.price} للقطعة</p>

                      <div className="cart-item-controls">
                        <div className="qty-picker">
                          <button onClick={() => updateQuantity(itemId, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(itemId, 1)}
                            disabled={isMax}
                            style={{
                              opacity: isMax ? 0.5 : 1,
                              cursor: isMax ? 'not-allowed' : 'pointer'
                            }}
                          >
                            +
                          </button>
                        </div>
                        <span className="cart-item-subtotal">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button onClick={() => removeItem(itemId)} className="btn-remove">
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="summary-row">
              <span>المجموع الكلي:</span>
              <strong>${totalPrice.toFixed(2)}</strong>
            </div>

            {localStorage.getItem('userId') ? (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-checkout"
              >
                {loading ? 'جاري الإرسال...' : 'تأكيد وشراء الطلب'}
              </button>
            ) : (
              <button
                className="btn-checkout"
                onClick={guestNavigate}
                disabled={loading}
              >
                {loading ? 'جاري الإرسال...' : 'سأشتري هذه المرة فقط'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;