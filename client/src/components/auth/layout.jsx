import { Link, Outlet } from 'react-router-dom';
import logoOmahring from '@/assets/logo-omahring.png';

function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="fixed top-4 left-6 z-10">
        <Link to="/" className="flex items-center">
          <img src={logoOmahring} alt="Omahring" className="h-8" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-white">
            Omahring
          </h1>
        </Link>
      </div>
      <div className="hidden lg:flex items-center justify-center bg-gray-800 w-1/2 px-12">
        <div className="max-w-md space-y-6 text-center text-primary-foreground">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Welcome to Omah-Ring Admin Panel
          </h1>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
