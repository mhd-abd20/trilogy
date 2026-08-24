import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/adminNavbar.css'; // استيراد التنسيقات

export default function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token'); 
    navigate('/login', { replace: true });
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-nav-container">
        <div className="admin-logo">
          <span>لوحة التحكم (Admin)</span>
        </div>

        <ul className="admin-nav-links">
          <li>
            <NavLink 
              to="/categories" 
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              الفئات (Categories)
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/add-promotions" 
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              العروض والتخفيضات
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/add-products" 
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              إدارة المنتجات
            </NavLink>
          </li>
        </ul>

        <button onClick={handleLogout} className="btn-logout">
          تسجيل الخروج
        </button>
      </div>
    </nav>
  );
}