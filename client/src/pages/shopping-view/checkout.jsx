import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createNewOrder, resetOrderState } from "@/store/shop/order-slice";
import { clearCart } from "@/store/shop/cart-slice";
import img from "../../assets/account.jpg";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const { token, orderId, isLoading, orderDetails } = useSelector((state) => state.shopOrder);

  const [addressInfo, setAddressInfo] = useState({
    name: user?.userName || "",
    email: user?.email || "",
    address: "",
    city: "",
    kodePos: "",
    phone: "",
    notes: "",
  });

  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      const script = document.createElement("script");
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        window.snap.pay(token, {
          onSuccess: function (result) {
            toast({ title: "Pembayaran Berhasil!", description: "Pesanan Anda sedang diproses." });
            sessionStorage.removeItem("currentOrderId");
            dispatch(clearCart());
            dispatch(resetOrderState());
          },
          onPending: function (result) {
            toast({ title: "Pembayaran Tertunda", description: "Silakan selesaikan pembayaran Anda." });
          },
          onError: function (result) {
            toast({ title: "Pembayaran Gagal", variant: "destructive" });
          },
          onClose: function () {
            toast({ title: "Jendela Pembayaran Ditutup", variant: "destructive" });
            dispatch(resetOrderState());
          },
        });
      };

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [token, dispatch, toast]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressInfo((prev) => ({ ...prev, [name]: value }));
  };

  const totalCartAmount = cartItems?.cartTotal || 0;

  const handleCheckout = () => {
    if (!cartItems?._id) {
        toast({ title: "Keranjang tidak ditemukan.", description: "Coba muat ulang halaman.", variant: "destructive" });
        return;
    }
    const { name, email, address, city, kodePos, phone } = addressInfo;
    if (!name || !email || !address || !city || !kodePos || !phone) {
      toast({ title: "Data Pengiriman Belum Lengkap", variant: "destructive" });
      return;
    }

    const orderData = {
      userId: user?._id || localStorage.getItem("cartSessionId") || `guest-${Date.now()}`,
      cartId: cartItems._id,
      cartItems: cartItems.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        image: item.image,
        price: item.variant.price,
        quantity: item.quantity,
        variantName: item.variant.name,
      })),
      addressInfo: {
        address: addressInfo.address,
        city: addressInfo.city,
        kodePos: addressInfo.kodePos,
        phone: addressInfo.phone,
        notes: addressInfo.notes,
      },
      totalAmount: totalCartAmount,
      customerName: name,
      email: email,
    };

    dispatch(createNewOrder(orderData));
  };

  if (orderDetails?.paymentStatus === "paid") {
    return <Navigate to="/shop/payment-success" replace />;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="relative h-[200px] md:h-[300px] w-full overflow-hidden rounded-lg mb-8">
        <img src={img} className="h-full w-full object-cover object-center" alt="Checkout banner"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Alamat Pengiriman</h2>
          <Input name="name" placeholder="Nama Lengkap" value={addressInfo.name} onChange={handleAddressChange} />
          <Input name="email" type="email" placeholder="Email" value={addressInfo.email} onChange={handleAddressChange} />
          <Textarea name="address" placeholder="Alamat Lengkap" value={addressInfo.address} onChange={handleAddressChange} />
          <Input name="city" placeholder="Kota" value={addressInfo.city} onChange={handleAddressChange} />
          <Input name="kodePos" placeholder="Kode Pos" value={addressInfo.kodePos} onChange={handleAddressChange} />
          <Input name="phone" placeholder="Nomor Telepon" value={addressInfo.phone} onChange={handleAddressChange} />
        </div>
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Ringkasan Pesanan</h2>
          <div className="space-y-2">
            {cartItems?.items?.map(item => (
                <div key={`${item.productId}-${item.variant.name}`} className="flex justify-between text-sm">
                    <span>{item.title} ({item.variant.name}) x {item.quantity}</span>
                    <span>Rp {(item.variant.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>Rp {totalCartAmount.toLocaleString("id-ID")}</span>
          </div>
          <Button
            onClick={handleCheckout}
            className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-lg py-6"
            disabled={isLoading || !cartItems?._id || cartItems.items.length === 0}
          >
            {isLoading ? "Memproses..." : "Bayar Sekarang"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
