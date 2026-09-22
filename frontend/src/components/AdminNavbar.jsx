import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiGrid, FiTag, FiBox, FiShield,FiBarChart2  } from 'react-icons/fi';
import { MdManageAccounts } from "react-icons/md";
import { LuNotebookPen } from "react-icons/lu";
import '../styles/adminNavbar.css';

export default function AdminNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    setIsMenuOpen(false);
    navigate('/login', { replace: true });
  };
  const asClient = () =>{
    localStorage.setItem("userId" , "10")
    localStorage.setItem('userRole', "client");
    navigate("/")
  }

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-nav-container">
        <div className="admin-brand">
          <FiShield className="brand-icon" />
          <span className="brand-title">لوحة التحكم</span>
        </div>

        <button 
          className="admin-menu-toggle" 
          onClick={toggleMenu}
          aria-label="تغيير القائمة"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className={`admin-nav-content ${isMenuOpen ? 'open' : ''}`}>
          <ul className="admin-nav-links">
            <li>
              <NavLink 
                to="/categories" 
                className={({ isActive }) => (isActive ? 'nav-item active-link' : 'nav-item')}
                onClick={closeMenu}
              >
                <FiGrid className="nav-icon" />
                <span>الفئات</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/add-promotions" 
                className={({ isActive }) => (isActive ? 'nav-item active-link' : 'nav-item')}
                onClick={closeMenu}
              >
                <FiTag className="nav-icon" />
                <span>العروض والتخفيضات</span>
              </NavLink>
            </li>
               <li>
              <NavLink 
                to="/manage-users" 
                className={({ isActive }) => (isActive ? 'nav-item active-link' : 'nav-item')}
                onClick={closeMenu}
              >
                <MdManageAccounts className="nav-icon" />
                <span>إدارة اليوزرات</span>
              </NavLink>
              </li>
            <li>
              <NavLink 
                to="/add-products" 
                className={({ isActive }) => (isActive ? 'nav-item active-link' : 'nav-item')}
                onClick={closeMenu}
              >
                <FiBox className="nav-icon" />
                <span>إدارة المنتجات</span>
              </NavLink>
              </li>

              <li>
              <NavLink 
                to="/sales-analytics" 
                className={({ isActive }) => (isActive ? 'nav-item active-link' : 'nav-item')}
                onClick={closeMenu}
              >
                <FiBarChart2 className="nav-icon" />
                <span>تحليلات المبيعات</span>
              </NavLink>
              
            </li>
                <li>
              <NavLink 
                to="/orders" 
                className={({ isActive }) => (isActive ? 'nav-item active-link' : 'nav-item')}
                onClick={closeMenu}
              >
                <LuNotebookPen className="nav-icon" />
                <span>سجل المبيعات</span>
              </NavLink>
              
            </li>
            <li>
               <button className='nav-item' style={{backgroundColor: "rgba(15, 23, 42, 0.95)" , border: " none"}}
               onClick={asClient}>
            الدخول كزبون
          </button>
            </li>
          </ul>

          <button onClick={handleLogout} className="btn-logout">
            <FiLogOut className="logout-icon" />
            <span>تسجيل الخروج</span>
          </button>
         
        </div>
      </div>
    </nav>
  );
}