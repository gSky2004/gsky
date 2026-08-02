import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { WishlistProvider } from './context/WishlistContext';
import { StoreLayout } from './components/layout/StoreLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { ScrollToHash } from './components/ScrollToHash';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackOrder from './pages/TrackOrder';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import NewsletterUnsubscribe from './pages/NewsletterUnsubscribe';
import NotFound from './pages/NotFound';

import { AdminLayout } from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminReviews from './pages/admin/AdminReviews';
import AdminDelivery from './pages/admin/AdminDelivery';
import AdminPromos from './pages/admin/AdminPromos';

import { CartSync } from './components/CartSync';

const App = () => (
  <ToastProvider>
    <AuthProvider>
      <CartProvider>
        <LanguageProvider>
          <BrowserRouter>
            <ScrollToTop />
            <ScrollToHash />
            <CartSync />
            <WishlistProvider>
            <Routes>
            <Route element={<StoreLayout />}>
              <Route index element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
              <Route element={<ProtectedRoute roles={['CLIENT', 'ADMIN']} />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route element={<AdminLayout />}>
                <Route index element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
                <Route path="products" element={<ErrorBoundary><AdminProducts /></ErrorBoundary>} />
                <Route path="products/new" element={<ErrorBoundary><AdminProductForm /></ErrorBoundary>} />
                <Route path="products/:id" element={<ErrorBoundary><AdminProductForm /></ErrorBoundary>} />
                <Route path="categories" element={<ErrorBoundary><AdminCategories /></ErrorBoundary>} />
                <Route path="orders" element={<ErrorBoundary><AdminOrders /></ErrorBoundary>} />
                <Route path="orders/:id" element={<ErrorBoundary><AdminOrderDetail /></ErrorBoundary>} />
                <Route path="customers" element={<ErrorBoundary><AdminCustomers /></ErrorBoundary>} />
                <Route path="newsletter" element={<ErrorBoundary><AdminNewsletter /></ErrorBoundary>} />
                <Route path="reviews" element={<ErrorBoundary><AdminReviews /></ErrorBoundary>} />
                <Route path="delivery" element={<ErrorBoundary><AdminDelivery /></ErrorBoundary>} />
                <Route path="promos" element={<ErrorBoundary><AdminPromos /></ErrorBoundary>} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </WishlistProvider>
        </BrowserRouter>
      </LanguageProvider>
    </CartProvider>
  </AuthProvider>
</ToastProvider>
);

export default App;
