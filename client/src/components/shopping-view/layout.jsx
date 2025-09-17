import { Outlet } from "react-router-dom";
import ShoppingHeader from "./header";
import ShoppingFooter from "./footer";

function ShoppingLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Common header */}
      <ShoppingHeader />
      <main className="flex flex-col flex-grow w-full">
        <Outlet />
      </main>
      {/* Common footer */}
      <ShoppingFooter />
    </div>
  );
}

export default ShoppingLayout;