import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { FiLogOut, FiLogIn, FiMenu, FiX, FiUser } from 'react-icons/fi';
import { openCartDrawer } from '../utils/cartDrawer.js';
import axios from 'axios';
import ThemeToggle from './ThemeToggle.jsx';
import '../styles/Navbar.css';

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;

const Navbar = () => {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem('userId');

  const getName = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${SERVER_ORIGIN}/api/users/${userId}`);
      setUser(res.data);
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    getName();
  }, [userId]);

  const updateCartCount = () => {
    const savedCart = JSON.parse(localStorage.getItem('trilogy_cart') || '[]');
    const totalItems = savedCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(totalItems);
  };

  useEffect(() => {
    updateCartCount();

    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('cartBadgeUpdated', updateCartCount)

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('cartBadgeUpdated', updateCartCount);
    };
  }, []);


  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('trilogy_cart')
    setIsMobileMenuOpen(false);
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className={`navbar ${isMobileMenuOpen ? 'menu-expanded' : ''}`}>
      <div className="navbar-container">
        {/* Brand & Desktop User Welcome */}
        <div className="navbar-brand">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            Trilogy
          </Link>
          {user?.name && (
            <div className="user-welcome desktop-welcome">
              <FiUser className="user-icon" />
              <span>مرحباً {user.name.split(' ')[0]}</span>
            </div>
          )}
        </div>

        {/* Links Section (Desktop & Mobile Drawer) */}
        <div className={`nav-links ${isMobileMenuOpen ? 'is-open' : ''}`}>
          {user?.name && (
            <div className="user-welcome mobile-welcome">
              <FiUser className="user-icon" />
              <span>مرحباً {user.name.split(' ')[0]}</span>
            </div>
          )}
          <NavLink
            to="/products"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            onClick={closeMobileMenu}
          >
            المنتجات
          </NavLink>
          <NavLink
            to="/promotions"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            onClick={closeMobileMenu}
          >
            العروضات
          </NavLink>
          {userId && (
            <NavLink
              to="/order-history"
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              onClick={closeMobileMenu}
            >
              مشترياتي
            </NavLink>
          )}

          {/* Mobile Auth Button Inside Drawer */}
          <div className="mobile-auth-container">
            {userId ? (
              <button
                className="nav-btn btn-logout mobile-btn"
                title="تسجيل الخروج"
                onClick={handleLogout}
              >
                <FiLogOut className="btn-icon" />
                <span>تسجيل الخروج</span>
              </button>
            ) : (
              <button
                className="nav-btn btn-login mobile-btn"
                title="تسجيل الدخول"
                onClick={() => {
                  closeMobileMenu();
                  navigate('/login');
                }}
              >
                <FiLogIn className="btn-icon" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Tools (Theme, Cart, Auth & Hamburger Toggle) */}
        <div className="nav-actions">
          <ThemeToggle />

          <button
            type="button"
            className="cart-icon-wrapper"
            aria-label="سلة التسوق"
            onClick={() => {
              closeMobileMenu();
              window.dispatchEvent(new Event('openCartDrawer'));
            }}
           
          >
            <FaShoppingCart className="cart-icon" />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {/* Desktop Auth Button */}
          <div className="desktop-auth-container">
            {userId ? (
              <button
                className="nav-btn btn-logout"
                title="تسجيل الخروج"
                onClick={handleLogout}
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

          {/* Hamburger Menu Toggle Button */}
          <button
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Backdrop for closing mobile menu on outside click */}
      {isMobileMenuOpen && (
        <div className="mobile-backdrop" onClick={closeMobileMenu} aria-hidden="true" />
      )}
    </nav>
  );
};

export default Navbar;