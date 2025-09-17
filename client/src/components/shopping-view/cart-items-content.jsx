import { Minus, Plus, Trash } from "lucide-react";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { deleteCartItem, updateCartQuantity, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "../ui/use-toast";
import { v4 as uuidv4 } from "uuid"; // Untuk generate sessionId baru jika diperlukan

function UserCartItemsContent({ cartItem }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Fungsi untuk mendapatkan atau membuat sessionId untuk guest user
  const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = `guest-${uuidv4()}`;
      localStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
  };

  // Fungsi untuk memperbarui kuantitas
  const handleUpdateQuantity = (typeOfAction) => {
    const newQuantity =
      typeOfAction === "plus" ? cartItem.quantity + 1 : cartItem.quantity - 1;

    if (newQuantity < 1) return; // Jangan biarkan kuantitas < 1

    // Validasi stok jika tersedia di cartItem (opsional, jika backend mengirimkan data stok)
    if (cartItem?.variant?.totalStock && newQuantity > cartItem.variant.totalStock) {
      toast({
        title: "Stok tidak mencukupi",
        description: `Maksimum stok untuk varian ${cartItem?.variant?.name} adalah ${cartItem.variant.totalStock}.`,
        variant: "destructive",
      });
      return;
    }

    const id = user?._id || getOrCreateSessionId();

    dispatch(
      updateCartQuantity({
        userId: id,
        productId: cartItem.productId,
        variantName: cartItem?.variant?.name || "Default",
        quantity: newQuantity,
      })
    ).then((result) => {
      if (result.payload?.success) {
        dispatch(fetchCartItems(id)); // Refresh keranjang
        toast({
          title: "Kuantitas diperbarui",
          description: `Kuantitas untuk ${cartItem?.title} telah diperbarui.`,
        });
      } else {
        toast({
          title: "Gagal memperbarui kuantitas",
          description: result.payload?.message || "Terjadi kesalahan, coba lagi nanti.",
          variant: "destructive",
        });
      }
    });
  };

  // Fungsi untuk menghapus item dari keranjang
  const handleCartItemDelete = () => {
    const id = user?._id || getOrCreateSessionId();

    dispatch(
      deleteCartItem({
        userId: id,
        productId: cartItem.productId,
        variantName: cartItem?.variant?.name || "Default",
      })
    ).then((result) => {
      if (result.payload?.success) {
        toast({ title: "Item dihapus dari keranjang." });
        dispatch(fetchCartItems(id)); // Refresh keranjang
      } else {
        toast({
          title: "Gagal menghapus item",
          description: result.payload?.message || "Terjadi kesalahan, coba lagi nanti.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex items-center space-x-4">
      <img
        src={cartItem?.image || "/placeholder.png"}
        alt={cartItem?.title || "Produk"}
        className="w-20 h-20 rounded object-cover"
      />
      <div className="flex-1">
        <h3 className="font-bold">{cartItem?.title || "Produk"}</h3>
        <p className="text-sm text-gray-500">
          {cartItem?.variant?.name || "Default"}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            className="h-8 w-8 rounded-full"
            size="icon"
            disabled={cartItem.quantity === 1}
            onClick={() => handleUpdateQuantity("minus")}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="font-semibold">{cartItem.quantity}</span>
          <Button
            variant="outline"
            className="h-8 w-8 rounded-full"
            size="icon"
            onClick={() => handleUpdateQuantity("plus")}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <p className="font-semibold">
          Rp{" "}
          {(
            (cartItem?.variant?.price || 0) * cartItem.quantity
          ).toLocaleString("id-ID")}
        </p>
        <Trash
          onClick={handleCartItemDelete}
          className="cursor-pointer mt-2 text-gray-500 hover:text-red-500"
          size={18}
        />
      </div>
    </div>
  );
}

export default UserCartItemsContent;