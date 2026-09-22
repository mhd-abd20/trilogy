import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRedirect from './components/HomeRedirect';
import AdminRoute from './components/AdminRoute';

import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';
import CartDrawer from './components/CartDrawer'; 

import CategoriesList from './pages/admin/CategoriesList';
import PromotionsCategories from './pages/admin/PromotionsCategories';
import Promotions from './pages/admin/Promotions';
import ProductsPage from './pages/admin/ProductsPage';
import LoginPage from './pages/admin/LoginPage';
import RegisterPage from './pages/admin/RegisterPage';
import OrdersPage from './pages/admin/OrdersPage';
import ManageUsersPage from './pages/admin/ManageUsersPage'

import HomePage from './pages/client/HomePage';
import Products from './pages/client/ProductsPage'; 
import CartPage from './pages/client/CartPage'; 
import PromotionsPage from './pages/client/PromotionsPage';
import PromotionDetails from './pages/client/PromotionDetails';
import ProductDetails from './pages/client/ProductDetails';
import GuestCheckoutPage from './pages/client/CheckoutPage';
import OrderHistory from './pages/client/OrderHistory';
import SalesAnalytics from './pages/admin/SalesAnalytics';  
const DynamicNavbar = () => {
  const location = useLocation();
  const role = localStorage.getItem('userRole');
  if (role === 'admin') {
    return <AdminNavbar />;
  }
  return <Navbar />;
};

function App() {
  return (
    <BrowserRouter>
    
      <DynamicNavbar />
      
      <Routes>
       
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}> 
          <Route path='/categories' element={<CategoriesList />} />
          <Route path='/add-promotions' element={<PromotionsCategories />} />
          <Route path='/add-promotions/:id' element={<Promotions />} />
          <Route path='/add-products' element={<ProductsPage />} />
          <Route path='/sales-analytics' element={<SalesAnalytics />} />
          <Route path='/orders' element={<OrdersPage />} />
          <Route path='/manage-users' element={<ManageUsersPage />} />
        </Route>

      <Route element={<AdminRoute allowedRoles={['admin']}/>}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/' element={<HomeRedirect />} />
        <Route path='/products' element={<Products />} />
        <Route path='/cart' element={<CartPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/promotions/:id" element={<PromotionDetails />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/guest-checkout" element={<GuestCheckoutPage />} />

        <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
          <Route path="/order-history" element={<OrderHistory />} />
        </Route>
        </Route>
      </Routes>
     <CartDrawer/>
    </BrowserRouter>
    
  );
}

export default App;