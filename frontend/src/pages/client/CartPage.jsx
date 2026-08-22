import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/CartPage.css';

const CartPage = () => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('trilogy_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('trilogy_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cart]);

  const guestNavigate = () => {
    if (cart.length === 0) return
    const payload = {
      items: cart.map((item) => ({
        productId: item.id || item.product_id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      totalAmount: totalPrice,
    };
    navigate('/guest-checkout', {
      state: { payload }
    })
  }

  const SERVER_ORIGIN = 'http://localhost:8080';
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
    setCart((prev) =>
      prev
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
        .filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => (item.id || item.product_id) !== id));
  };

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.id || item.product_id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        totalAmount: totalPrice,
      };

      await axios.post('http://localhost:8080/api/orders/checkout', payload);

      alert('تم إرسال الطلب بنجاح وتحديث المخزون!');
      setCart([]);
      localStorage.removeItem('trilogy_cart');
      navigate('/products');
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-page-container">
      <div className="cart-header">
        <h2>سلة التسوق</h2>
        <Link to="/products" className="back-link">← العودة للمتجر</Link>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>السلة فارغة حالياً</p>
          <Link to="/products" className="btn-shop">تصفح المنتجات</Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-table">
            {cart.map((item) => {
              const itemId = item.id || item.product_id;
              return (
                <div key={itemId} className="cart-row">
                  <div className="cart-item-img-wrapper">
                    <img
                      src={getImageUrl(item.image_url)}
                      alt={item.name || item.product_name}
                    />
                  </div>

                  <div className="item-info">
                    <h4>{item.name || item.product_name}</h4>
                    <p>${item.price} للقطعة</p>
                  </div>

                  <div className="qty-picker">
                    <button onClick={() => updateQuantity(itemId, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(itemId, 1)}
                      disabled={item.quantity >= (item.stock ?? item.stock_quantity ?? Infinity)}
                      style={{
                        opacity: item.quantity >= (item.stock ?? item.stock_quantity ?? Infinity) ? 0.5 : 1,
                        cursor: item.quantity >= (item.stock ?? item.stock_quantity ?? Infinity) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div className="item-total">
                    ${item.price * item.quantity}
                  </div>

                  <button onClick={() => removeItem(itemId)} className="btn-remove">
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <h3>ملخص الطلب</h3>
            <div className="summary-row">
              <span>المجموع الكلي:</span>
              <strong>${totalPrice}</strong>
            </div>
            {localStorage.getItem('userI') ? (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-checkout"
              >
                {loading ? 'جاري الإرسال...' : 'تأكيد وشراء الطلب'}
              </button>
            )
              : (
                <button
                  className="btn-checkout"
                  onClick={guestNavigate}
                >
                  {loading ? 'جاري الإرسال...' : ' سأشتري هذه المرة فقط '}
                </button>
              )}

          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;