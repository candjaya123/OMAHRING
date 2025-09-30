import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import UserCartItemsContent from './cart-items-content';
import { useSelector } from 'react-redux';

function UserCartWrapper({ setOpenCartSheet }) {
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.shopCart);

  const items = cartItems?.items || [];
  const totalCartAmount = cartItems?.cartTotal || 0;

  return (
    <SheetContent className="sm:max-w-md flex flex-col">
      <SheetHeader>
        <SheetTitle>Keranjang Anda</SheetTitle>
      </SheetHeader>

      <SheetDescription></SheetDescription>
      <div className="flex-grow overflow-y-auto mt-8 space-y-4 pr-4">
        {items.length > 0 ? (
          items.map((item, index) => (
            <UserCartItemsContent
              key={`${item.productId}-${item?.variant?.name || index}`}
              cartItem={item}
            />
          ))
        ) : (
          <p className="text-center text-gray-500">Keranjang Anda masih kosong.</p>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t pt-6 mt-auto">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>Rp {totalCartAmount.toLocaleString('id-ID')}</span>
          </div>
          <Button
            onClick={() => {
              navigate('/shop/checkout');
              setOpenCartSheet(false);
            }}
            className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
          >
            Checkout
          </Button>
        </div>
      )}
    </SheetContent>
  );
}

export default UserCartWrapper;
