import CommonForm from '@/components/common/form';
import { useToast } from '@/components/ui/use-toast';
import { loginFormControls } from '@/config';
import { loginUser } from '@/store/auth-slice';
import { mergeCart } from '@/store/shop/cart-slice';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

const initialState = {
  email: '',
  password: '',
};

function AuthLogin() {
  const [formData, setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { cartItems } = useSelector((state) => state.shopCart);
  const navigate = useNavigate();

  function onSubmit(event) {
    event.preventDefault();

    dispatch(loginUser(formData)).then((data) => {
      if (data?.payload?.success) {
        toast({ title: data?.payload?.message });

        const sessionId = localStorage.getItem('sessionId');

        // ✅ Cek cart guest
        if (sessionId && cartItems.items.length > 0) {
          const confirmMerge = window.confirm(
            'Keranjang tamu ditemukan. Gabungkan dengan keranjang akun Anda?'
          );

          const actionType = confirmMerge ? 'merge' : 'replace';

          dispatch(
            mergeCart({
              userId: data.payload.user.id,
              sessionId,
              action: actionType,
            })
          ).then(() => {
            localStorage.removeItem('sessionId');
            toast({
              title: confirmMerge
                ? 'Keranjang berhasil digabungkan!'
                : 'Keranjang tamu dihapus. Menggunakan keranjang akun Anda.',
            });
            navigate('/');
          });
        } else {
          localStorage.removeItem('sessionId');
          navigate('/');
        }
      } else {
        toast({
          title: data?.payload?.message,
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sign in to your account
        </h1>
        <p className="mt-2">
          Don&apos;t have an account
          <Link
            className="font-medium ml-2 text-primary hover:text-orange-500 hover:underline transition-colors duration-300"
            to="/auth/register"
          >
            Register
          </Link>
        </p>
      </div>
      <CommonForm
        formControls={loginFormControls}
        buttonText="Sign In"
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        buttonClassName="text-gray-800 text-white hover:bg-orange-500 hover:text-white transition-colors duration-300"
      />
    </div>
  );
}

export default AuthLogin;
