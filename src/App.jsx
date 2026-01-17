import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { CurrencyProvider } from './components/CurrencyContext';
import { CartProvider } from './components/CartContext';
import { ProductsProvider } from './components/ProductContext';
import { CategoryProvider } from './components/CategoryContext';
import { NotificationProvider } from './components/NotificationContext';
import Notification from './components/Notification';
import Layout from './components/Layout';
import Home from './pages/Home';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import { Men, Women, Sale } from './pages/Categories';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLogin from './pages/Admin/Login';
import CustomerLogin from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Profile from './pages/Auth/Profile';
import OrderSuccess from './pages/OrderSuccess';
import { OrderProvider } from './components/OrderContext';
import CartDrawer from './components/CartDrawer';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProductDetails from './pages/ProductDetails';
import BroadcastPopup from './components/BroadcastPopup';
import DisableDevTools from './components/DisableDevTools';

function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <ProductsProvider>
          <CurrencyProvider>
            <ProductsProvider>
              <CategoryProvider>
                <Router>
                  <AuthProvider>
                    <CartProvider>
                      <NotificationProvider>
                        <OrderProvider>
                          <DisableDevTools />
                          <Layout>
                            <Routes>
                              <Route path="/" element={<Home />} />
                              <Route path="/men" element={<Men />} />
                              <Route path="/women" element={<Women />} />
                              <Route path="/sale" element={<Sale />} />
                              <Route path="/product/:id" element={<ProductDetails />} />
                              <Route path="/contact" element={<ContactUs />} />
                              <Route path="/about" element={<AboutUs />} />
                              <Route path="/order-success" element={<OrderSuccess />} />
                              <Route path="/login" element={<CustomerLogin />} />
                              <Route path="/signup" element={<Signup />} />
                              <Route path="/verify-email" element={<VerifyEmail />} />
                              <Route path="/forgot-password" element={<ForgotPassword />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/admin/login" element={<AdminLogin />} />
                              <Route path="/admin" element={
                                <ProtectedRoute>
                                  <AdminDashboard />
                                </ProtectedRoute>
                              } />
                            </Routes>
                            <CartDrawer />
                            <Notification />
                            <BroadcastPopup />
                          </Layout>
                        </OrderProvider>
                      </NotificationProvider>
                    </CartProvider>
                  </AuthProvider>
                </Router>
              </CategoryProvider>
            </ProductsProvider>
          </CurrencyProvider>
        </ProductsProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
