import CommonForm from '@/components/common/form';
import { loginFormControls } from '@/config';
import useToast from '@/hooks/useToast';
import { loginUser } from '@/store/auth-slice';
import { mergeCart } from '@/store/shop/cart-slice';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

const initialState = {
  email: '',
  password: '',
};

function AuthLogin() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const toast = useToast();
  const { cartItems } = useSelector((state) => state.shopCart);
  const navigate = useNavigate();

  function onSubmit(event) {
    event.preventDefault();

    dispatch(loginUser(formData)).then((data) => {
      if (data?.payload?.success) {
        toast.toastSuccess('Sukses', 'Login berhasil.');

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
            toast.toastSuccess(
              'Sukses',
              confirmMerge
                ? 'Keranjang berhasil digabungkan!'
                : 'Keranjang tamu dihapus. Menggunakan keranjang akun Anda.'
            );
            navigate('/');
          });
        } else {
          localStorage.removeItem('sessionId');
          navigate('/');
        }
      } else {
        toast.toastError('Gagal', 'Login gagal');
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('auth.login')}
        </h1>
        <p className="mt-2 text-gray-500">
          {t('auth.dont_have_account')}
          <Link
            className="font-medium ml-2 text-orange-600 hover:text-orange-500 hover:underline transition-colors duration-300"
            to="/auth/register"
          >
            {t('auth.register')}
          </Link>
        </p>
      </div>
      <CommonForm
        formControls={loginFormControls}
        buttonText={t('auth.login')}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        buttonClassName="w-full bg-orange-600 hover:bg-orange-700 text-white transition-colors duration-300 rounded-xl h-12"
      />
    </div>
  );
}

export default AuthLogin;
