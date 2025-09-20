import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

function AuthedGuard() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}

export default AuthedGuard;
