import { Minus, Plus, Trash } from 'lucide-react';
import { Button } from '../ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { deleteCartItem, updateCartQuantity, fetchCartItems } from '@/store/shop/cart-slice';
import { useToast } from '../ui/use-toast';

function UserCartItemsContent({ cartItem }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const sessionId = localStorage.getItem('sessionId');

  const handleUpdateQuantity = (typeOfAction) => {
    const newQuantity = typeOfAction === 'plus' ? cartItem.quantity + 1 : cartItem.quantity - 1;

    if (newQuantity < 1) return;

    if (typeOfAction === 'plus' && newQuantity > cartItem.variant.totalStock) {
      toast({
        title: 'Stok tidak mencukupi',
        description: `Maksimum stok untuk varian ${cartItem?.variant?.name} adalah ${cartItem.variant.totalStock}.`,
        variant: 'destructive',
      });
      return;
    }

    const dataUpdate = {
      userId: user?.id || null,
      sessionId: user ? null : sessionId,
      productId: cartItem.productId,
      variantName: cartItem?.variant?.name || 'Default',
      quantity: newQuantity,
    };

    dispatch(updateCartQuantity(dataUpdate)).then((result) => {
      if (result.payload?.success) {
        dispatch(fetchCartItems(user?.id || sessionId));
        toast({
          title: 'Kuantitas diperbarui',
          description: `Kuantitas untuk ${cartItem?.title} telah diperbarui.`,
        });
      } else {
        toast({
          title: 'Gagal memperbarui kuantitas',
          description: result.payload?.message || 'Terjadi kesalahan, coba lagi nanti.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleCartItemDelete = () => {
    dispatch(
      deleteCartItem({
        id: user?.id || sessionId,
        productId: cartItem.productId,
        variantName: cartItem?.variant?.name || 'Default',
      })
    ).then((result) => {
      if (result.payload?.success) {
        toast({ title: 'Item dihapus dari keranjang.' });
        dispatch(fetchCartItems(user?.id || sessionId)); // Refresh keranjang
      } else {
        toast({
          title: 'Gagal menghapus item',
          description: result.payload?.message || 'Terjadi kesalahan, coba lagi nanti.',
          variant: 'destructive',
        });
      }
    });
  };

  const calculatePriceTotal = (cartItem) => {
    let priceTotal;
    if (cartItem.variant.salePrice > 0) {
      priceTotal = cartItem.variant.salePrice * cartItem.quantity;
    } else {
      priceTotal = cartItem.variant.price * cartItem.quantity;
    }
    return priceTotal;
  };

  return (
    <div className="flex items-center space-x-4">
      <img src={cartItem?.image} alt={cartItem?.title} className="w-20 h-20 rounded object-cover" />
      <div className="flex-1">
        <h3 className="font-bold">{cartItem?.title}</h3>
        <p className="text-sm text-gray-500">{cartItem?.variant?.name}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            className="h-8 w-8 rounded-full"
            size="icon"
            disabled={cartItem.quantity === 1}
            onClick={() => handleUpdateQuantity('minus')}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="font-semibold">{cartItem.quantity}</span>
          <Button
            variant="outline"
            className="h-8 w-8 rounded-full"
            size="icon"
            onClick={() => handleUpdateQuantity('plus')}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <p className="font-semibold">Rp {calculatePriceTotal(cartItem).toLocaleString('id-ID')}</p>
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
