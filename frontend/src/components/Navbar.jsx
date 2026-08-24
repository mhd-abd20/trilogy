import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { FiLogOut, FiLogIn } from 'react-icons/fi';
import axios from 'axios';
import ThemeToggle from './ThemeToggle.jsx';
import '../styles/Navbar.css';

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;
const Navbar = () => {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState();

  const navigate = useNavigate();
  const id = localStorage.getItem('userId')

  const getName = async () => {
    if(!id) return;
    try {
      const res = await axios.get(`${SERVER_ORIGIN}/api/users/${id}`);
      setUser(res.data)
    }
    catch (err) {
      console.log(err.message)
    }
  }
useEffect(()=>{
  getName()
},[id])

  const updateCartCount = () => {
    const savedCart = JSON.parse(localStorage.getItem('trilogy_cart') || '[]');
    const totalItems = savedCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(totalItems);
  };

  useEffect(() => {
    updateCartCount();

    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const userId = localStorage.getItem('userId');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {user?.name && (
          <p className="user-welcome">مرحباً {user.name.split(" ")[0]}</p>
        )}
        <Link to="/" className="logo">
          Trilogy
        </Link>


        <div className="nav-links">
          <Link to="/products" className="nav-item">المنتجات</Link>
          <Link to="/promotions" className="nav-item">العروضات</Link>
          {userId && (
            <Link to="/order-history" className="nav-item">مشترياتي</Link>
          )}
        </div>

        {/* أدوات الإجراءات */}
        <div className="nav-actions">
          <ThemeToggle />

          <Link to="/cart" className="cart-icon-wrapper" aria-label="سلة التسوق">
            <FaShoppingCart className="cart-icon" />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {userId ? (
            <button
              className="nav-btn btn-logout"
              title="تسجيل الخروج"
              onClick={() => {
                localStorage.removeItem('userId');
                window.location.reload();
                navigate('/')
              }}
            >
              <FiLogOut className="btn-icon" />
              <span className="btn-text">تسجيل الخروج</span>
            </button>
          ) : (
            <button
              className="nav-btn btn-login"
              title="تسجيل الدخول"
              onClick={() => navigate('/login')}
            >
              <FiLogIn className="btn-icon" />
              <span className="btn-text">تسجيل الدخول</span>
            </button>
          )}  
        </div>
      </div>
    </nav>
  );
};

export default Navbar;