import { Bird, LogOut, Menu, ShoppingCart, UserCog } from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { shoppingViewHeaderMenuItems } from "@/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { logoutUser } from "@/store/auth-slice";
import UserCartWrapper from "./cart-wrapper";
import { useEffect, useState } from "react";
import { fetchCartItems } from "@/store/shop/cart-slice";

function MenuItems() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDropdown, setOpenDropdown] = useState(false);

  function handleNavigate(menuItem) {
    setOpenDropdown(false); // Close dropdown after clicking
    sessionStorage.removeItem("filters");
    const currentFilter =
      menuItem.id !== "home" && menuItem.id !== "informasi"
        ? { category: [menuItem.id] }
        : null;

    sessionStorage.setItem("filters", JSON.stringify(currentFilter));

    if (location.pathname.includes("listing") && currentFilter !== null) {
      setSearchParams(new URLSearchParams(`?category=${menuItem.id}`));
    } else {
      navigate(menuItem.path);
    }
  }

  return (
    <nav className="flex flex-col mb-3 lg:mb-0 lg:items-center gap-6 lg:flex-row relative">
      {/* Beranda */}
      <div
        onClick={() => handleNavigate({ id: "home", path: "/shop/home" })}
        className="text-base font-semibold text-gray-800 cursor-pointer hover:text-orange-500 transition-colors duration-300"
        role="button"
      >
        Beranda
      </div>

      {/* Dropdown Toko */}
      <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
        <DropdownMenuTrigger asChild>
          <div
            onMouseEnter={() => setOpenDropdown(true)}
            onMouseLeave={() => setOpenDropdown(false)}
            className="text-base font-semibold text-gray-800 cursor-pointer flex items-center hover:text-orange-500 transition-colors duration-300"
            role="button"
          >
            Toko <span className="ml-1 text-sm">▼</span>
          </div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent
          className="w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
          onMouseEnter={() => setOpenDropdown(true)}
          onMouseLeave={() => setOpenDropdown(false)}
        >
          {shoppingViewHeaderMenuItems
            .filter((item) => item.id !== "home" && item.id !== "search")
            .map((menuItem) => (
              <DropdownMenuItem
                key={menuItem.id}
                onClick={() => {
                  handleNavigate(menuItem);
                  setOpenDropdown(false); // tutup setelah klik
                }}
                className="text-sm font-medium text-gray-800 cursor-pointer px-3 py-2 hover:bg-orange-50 hover:text-orange-500 rounded-md transition-colors duration-300"
              >
                {menuItem.label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Informasi */}
      <div
        onClick={() => handleNavigate({ id: "informasi", path: "/shop/blog" })}
        className="text-base font-semibold text-gray-800 cursor-pointer hover:text-orange-500 transition-colors duration-300"
        role="button"
      >
        Informasi
      </div>
    </nav>
  );
}

function HeaderRightContent() {
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const [openCartSheet, setOpenCartSheet] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function handleLogout() {
    dispatch(logoutUser());
    navigate("/shop/login");
  }

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCartItems(user.id));
    }
  }, [dispatch, user?.id]);

  return (
    <div className="flex lg:items-center lg:flex-row flex-col gap-4">
      <Sheet open={openCartSheet} onOpenChange={setOpenCartSheet}>
        <Button
          onClick={() => setOpenCartSheet(true)}
          variant="outline"
          size="icon"
          className="relative border-gray-300 bg-white hover:bg-orange-500 hover:text-white transition-colors duration-300"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute top-[-8px] right-[-8px] bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartItems?.items?.length || 0}
          </span>
          <span className="sr-only">Keranjang</span>
        </Button>
        <UserCartWrapper
          setOpenCartSheet={setOpenCartSheet}
          cartItems={cartItems?.items || []}
        />
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="bg-black ring-2 ring-orange-500 cursor-pointer">
            <AvatarFallback className="bg-black text-white font-extrabold">
              {user?.userName ? user.userName[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="w-56 bg-white border-gray-200 shadow-md">
          <DropdownMenuLabel className="text-gray-800">
            Masuk sebagai {user?.userName || "Pengguna"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigate("/shop/account")}
            className="text-gray-800 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-300"
          >
            <UserCog className="mr-2 h-4 w-4" />
            Akun
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-gray-800 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ShoppingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/shop/home" className="flex items-center gap-2">
          <Bird className="h-8 w-8 text-orange-500" />
          <span className="font-bold text-xl text-gray-800">Omahring</span>
        </Link>
        <div className="hidden lg:flex lg:items-center lg:gap-6">
          <MenuItems />
        </div>
        <div className="hidden lg:block">
          <HeaderRightContent />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden border-gray-300 bg-white hover:bg-orange-500 hover:text-white transition-colors duration-300"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Buka menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-xs bg-white">
            <MenuItems />
            <div className="mt-6 border-t border-gray-200 pt-6">
              <HeaderRightContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export default ShoppingHeader;