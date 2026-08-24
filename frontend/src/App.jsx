import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import CategoriesList from './pages/admin/CategoriesList';
import PromotionsCategories from './pages/admin/PromotionsCategories';
import Promotions from './pages/admin/Promotions';
import ProductsPage from './pages/admin/ProductsPage';
import LoginPage from './pages/admin/LoginPage';
import RegisterPage from './pages/admin/RegisterPage';
import HomePage from './pages/client/HomePage';
import Navbar from './components/Navbar'; 
import AdminNavbar from './components/AdminNavbar';
import Products from './pages/client/ProductsPage'; 
import CartPage from './pages/client/CartPage'; 
import PromotionsPage from './pages/client/PromotionsPage';
import PromotionDetails from './pages/client/PromotionDetails';
import ProductDetails from './pages/client/ProductDetails';
import GuestCheckoutPage from './pages/client/CheckoutPage';
import OrderHistory from './pages/client/OrderHistory';
import HomeRedirect from './components/HomeRedirect';

const DynamicNavbar = () => {
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
        </Route>

       
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;