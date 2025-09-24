import { Navigate, useLocation } from 'react-router-dom';

function CheckAuth({ isAuthenticated, user, children }) {
  const location = useLocation();

  // 🔹 Root "/" → selalu redirect ke shop/home
  if (location.pathname === '/') {
    return <Navigate to="/shop/home" />;
  }

  // 🔹 Auth page (login & register) → kalau sudah login redirect
  if (
    isAuthenticated &&
    (location.pathname.includes('/login') || location.pathname.includes('/register'))
  ) {
    if (user?.role === 'admin' || user?.role === 'manager') {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/shop/home" />;
    }
  }

  // 🔹 Admin route → wajib login & role admin atau manager
  if (location.pathname.includes('/admin')) {
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" />;
    }
    // ⬇️ PERBAIKAN DI SINI ⬇️
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      return <Navigate to="/unauth-page" />;
    }
  }

  return <>{children}</>;
}

export default CheckAuth;
