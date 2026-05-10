import {
  BadgeCheck,
  LayoutDashboard,
  ShoppingBasket,
  Users,
  TicketPercent,
  FileText, // 🔹 Impor ikon baru
  UserCog, // 🔹 Impor ikon baru
  Settings,
  MessageCircle, // 🔹 Impor ikon baru
} from 'lucide-react';
import { Fragment, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // 🔹 Impor useSelector
import { getUnreadCount } from '@/store/shop/chat-slice';
import { Sheet, SheetContent } from '../ui/sheet';
import logoOmahring from '@/assets/logo-omahring.png';

// =================================================================
// Data Menu Sidebar dengan Hak Akses (Roles)
// =================================================================
const adminSidebarMenuItems = [
  {
    id: 'dashboard',
    label: 'Dasbor',
    path: '/admin/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ['admin', 'manager'], // 👈 Bisa diakses oleh admin & manager
  },
  {
    id: 'products',
    label: 'Produk',
    path: '/admin/products',
    icon: <ShoppingBasket size={20} />,
    roles: ['admin', 'manager'],
  },
  {
    id: 'orders',
    label: 'Pesanan',
    path: '/admin/orders',
    icon: <BadgeCheck size={20} />,
    roles: ['admin', 'manager'],
  },
  {
    id: 'articles',
    label: 'Artikel',
    path: '/admin/articles',
    icon: <FileText size={20} />,
    roles: ['admin', 'manager'],
  },
  {
    id: 'customers',
    label: 'Pelanggan',
    path: '/admin/customers',
    icon: <Users size={20} />,
    roles: ['admin', 'manager'],
  },
  {
    id: 'promos',
    label: 'Promo',
    path: '/admin/promos',
    icon: <TicketPercent size={20} />,
    roles: ['admin', 'manager'],
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    path: '/admin/settings',
    icon: <Settings size={20} />,
    roles: ['admin', 'manager'],
  },
  {
    id: 'chat',
    label: 'Live Chat',
    path: '/admin/chat',
    icon: <MessageCircle size={20} />,
    roles: ['admin', 'manager'],
  },
  // 🔹 MENU BARU KHUSUS MANAGER 🔹
  {
    id: 'reports',
    label: 'Laporan',
    path: '/admin/reports',
    icon: <FileText size={20} />,
    roles: ['manager'], // 👈 Hanya bisa diakses oleh manager
  },
  {
    id: 'admins',
    label: 'Admin',
    path: '/admin/manage-admins',
    icon: <UserCog size={20} />,
    roles: ['manager'], // 👈 Hanya bisa diakses oleh manager
  },
  {
    id: 'chat-logs',
    label: 'Chat Logs',
    path: '/admin/chat-logs',
    icon: <MessageCircle size={20} />,
    roles: ['manager'], // 👈 Hanya bisa diakses oleh manager
  },
];

// =================================================================
// Komponen Konten Sidebar (Diperbarui)
// =================================================================
function SidebarContent({ setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch(); // 🔹 Ambil dispatch
  // 🔹 Ambil data pengguna yang sedang login dari Redux
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.shopChat); // 🔹 Ambil unreadCount

  useEffect(() => {
    // Ambil jumlah unread secara berkala
    const interval = setInterval(() => {
      dispatch(getUnreadCount());
    }, 10000); // 10 detik

    dispatch(getUnreadCount());
    return () => clearInterval(interval);
  }, [dispatch]);

  function handleNavigate(path) {
    navigate(path);
    if (setOpen) {
      setOpen(false);
    }
  }

  // 🔹 Filter menu berdasarkan peran (role) pengguna
  const visibleMenuItems = adminSidebarMenuItems.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="flex flex-col h-full">
      <div
        onClick={() => navigate('/shop/home')}
        className="flex cursor-pointer items-center border-b pb-6"
      >
        <img src={logoOmahring} alt="Omahring" className="h-8" />
        <h1 className="text-xl font-bold tracking-tight">
          Omahring<span className="text-gray-400 font-light">.admin</span>
        </h1>
      </div>

      <nav className="mt-6 flex flex-col gap-2">
        {/* 🔹 Tampilkan menu yang sudah difilter */}
        {visibleMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <div
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={`
                flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-all duration-200
                ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.id === 'chat' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// =================================================================
// Komponen Utama AdminSideBar (Tidak ada perubahan)
// =================================================================
function AdminSideBar({ open, setOpen }) {
  return (
    <Fragment>
      {/* Tampilan Mobile (Sheet) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-white p-6">
          <SidebarContent setOpen={setOpen} />
        </SheetContent>
      </Sheet>

      {/* Tampilan Desktop (Aside) */}
      <aside className="hidden w-64 flex-col border-r bg-white p-6 lg:flex">
        <SidebarContent />
      </aside>
    </Fragment>
  );
}

export default AdminSideBar;
