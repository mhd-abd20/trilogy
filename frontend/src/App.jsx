import {BrowserRouter,Route,Routes} from 'react-router-dom'

import CategoriesList from './pages/admin/CategoriesList'
import PromotionsCategories from './pages/admin/PromotionsCategories'
import Promotions from './pages/admin/Promotions'
import ProductsPage from './pages/admin/ProductsPage'
import LoginPage from './pages/admin/LoginPage'
import RegisterPage from './pages/admin/RegisterPage'
import HomePage from './pages/client/HomePage'
import Navbar from './components/Navbar' 
import Products from './pages/client/ProductsPage' 
import CartPage from './pages/client/CartPage' 
import PromotionsPage from './pages/client/PromotionsPage';
import PromotionDetails from './pages/client/PromotionDetails';
import ProductDetails from './pages/client/ProductDetails';
import GuestCheckoutPage from './pages/client/CheckoutPage';
import OrderHistory from './pages/client/OrderHistory'

function App() {


  return (
    <BrowserRouter>
    <Navbar/>
    <Routes>
      <Route path='/categories' element={<CategoriesList/>}></Route>
      <Route path='/add-promotions' element={<PromotionsCategories/>}></Route>
      <Route path='/add-promotions/:id' element={<Promotions/>}></Route>
      <Route path='/add-products' element={<ProductsPage/>}></Route>
      <Route path='/login' element={<LoginPage/>}></Route>
       <Route path='/register' element={<RegisterPage/>}></Route>


      <Route path='/' element={<HomePage/>}></Route>
      <Route path='/products' element={<Products/>}></Route>
       <Route path='/cart' element={<CartPage/>}></Route>
       <Route path="/promotions" element={<PromotionsPage />} />
  <Route path="/promotions/:id" element={<PromotionDetails />} />
   <Route path="/products/:id" element={<ProductDetails />} />
   <Route path="/guest-checkout" element={<GuestCheckoutPage />} />
    <Route path="/order-history" element={<OrderHistory />} />
    </Routes>
    
    </BrowserRouter>
  )
}

export default App
