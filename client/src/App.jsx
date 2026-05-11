import { Route, Routes } from 'react-router-dom';
import AuthLayout from './components/auth/layout';
import AuthLogin from './pages/auth/login';
import AuthRegister from './pages/auth/register';
import AdminLayout from './components/admin-view/layout';
import AdminDashboard from './pages/admin-view/dashboard';
import AdminProducts from './pages/admin-view/products';
import AdminOrders from './pages/admin-view/orders';
import AdminCustomersView from './pages/admin-view/customers';
import AdminFeatures from './pages/admin-view/features';
import AdminSettings from './pages/admin-view/settings';
import AdminPromosView from './pages/admin-view/promos'; // 🔹 1. Impor halaman promo
import ShoppingLayout from './components/shopping-view/layout';
import NotFound from './pages/not-found';
import ShoppingHome from './pages/shopping-view/home';
import ShoppingListing from './pages/shopping-view/listing';
import ShoppingCheckout from './pages/shopping-view/checkout';
import ShoppingAccount from './pages/shopping-view/account';
import CheckAuth from './components/common/check-auth';
import UnauthPage from './pages/unauth-page';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { checkAuth } from './store/auth-slice';
import { Skeleton } from '@/components/ui/skeleton';
import PaymentSuccessPage from './pages/shopping-view/payment-success';
import SearchProducts from './pages/shopping-view/search';
import BlogPage from './pages/shopping-view/blog';
import MembershipPage from './pages/shopping-view/membership'; // 🔹 1. Impor halaman baru
import AdminArticles from './pages/admin-view/articles'; // 🔹 Impor halaman artikel
import MemberDashboard from './pages/member-view/dashboard';
import MemberArticles from './pages/member-view/articles'; // 🔹 Impor halaman artikel member
import AdminReportsView from './pages/admin-view/reports'; // 🔹 1. Impor halaman laporan
import AdminManagementView from './pages/admin-view/manage-admins'; // 🔹 1. Impor halaman baru
import ProductDetailPage from './pages/shopping-view/product-detail';
import { v4 as uuidv4 } from 'uuid';
import PaymentPendingPage from './pages/shopping-view/payment-pending';
import { ToastContainer } from 'react-toastify';
import ArticleDetailPage from './pages/shopping-view/article-detail';
import PaymentInstructionPage from './pages/shopping-view/payment-instruction';

function App() {
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const getOrSetSessionId = () => {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId && !isAuthenticated) {
      sessionId = `guest-${uuidv4()}`;
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated && user === null) {
      getOrSetSessionId();
    }
  }, [isLoading, isAuthenticated, user]);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) return <Skeleton className="w-[800] bg-black h-[600px]" />;

  return (
    <div className="flex flex-col overflow-hidden bg-white">
      <Routes>
        {/* root */}
        <Route
          path="/"
          element={<CheckAuth isAuthenticated={isAuthenticated} user={user}></CheckAuth>}
        />

        {/* auth */}
        <Route
          path="/auth"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AuthLayout />
            </CheckAuth>
          }
        >
          <Route path="login" element={<AuthLogin />} />
          <Route path="register" element={<AuthRegister />} />
        </Route>

        {/* admin → wajib login */}
        <Route
          path="/admin"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AdminLayout />
            </CheckAuth>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomersView />} />
          <Route path="promos" element={<AdminPromosView />} />{' '}
          <Route path="articles" element={<AdminArticles />} />{' '}
          {/* 🔹 2. Tambahkan rute baru di sini */}
          <Route path="reports" element={<AdminReportsView />} />{' '}
          {/* 🔹 2. Tambahkan rute baru di sini */}
          <Route path="manage-admins" element={<AdminManagementView />} />{' '}
          {/* 🔹 2. Tambahkan rute baru di sini */}
          <Route path="features" element={<AdminFeatures />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="chat-logs" element={<AdminChatLogs />} />
        </Route>

        {/* member → wajib login member */}
        <Route
          path="/member"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <ShoppingLayout />
            </CheckAuth>
          }
        >
          <Route path="dashboard" element={<MemberDashboard />} />
          <Route path="articles" element={<MemberArticles />} />
        </Route>

        {/* shop → bebas login */}
        <Route path="/shop" element={<ShoppingLayout />}>
          <Route path="home" element={<ShoppingHome />} />
          <Route path="listing" element={<ShoppingListing />} />
          <Route path="search" element={<SearchProducts />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="article/:id" element={<ArticleDetailPage />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="product/:productId" element={<ProductDetailPage />} />
          <Route path="checkout" element={<ShoppingCheckout />} />
          <Route path="payment-success" element={<PaymentSuccessPage />} />
          <Route path="payment-pending/:orderId" element={<PaymentPendingPage />} />
          <Route path="payment-instruction/:orderId" element={<PaymentInstructionPage />} />
          <Route path="account" element={<ShoppingAccount />} />
        </Route>

        <Route path="/birds/:id" element={<BirdProfile />} />
        <Route path="/unauth-page" element={<UnauthPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;
