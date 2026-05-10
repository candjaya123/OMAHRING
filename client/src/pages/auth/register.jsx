import CommonForm from '@/components/common/form';
import { registerFormControls } from '@/config';
import useToast from '@/hooks/useToast';
import { registerUser } from '@/store/auth-slice';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

const initialState = {
  userName: '',
  email: '',
  password: '',
  role: 'user',
  nik: '',
  phone_number: '',
};

function AuthRegister() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  function onSubmit(event) {
    event.preventDefault();
    dispatch(registerUser(formData)).then((data) => {
      if (data?.payload?.success) {
        toast.toastSuccess('Sukses', 'Anda berhasil mendaftarkan akun');
        navigate('/auth/login');
      } else {
        toast.toastError('Gagal', data?.payload?.message || 'Coba mendaftar lagi');
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('auth.register')}</h1>
        <p className="mt-2 text-gray-500">
          {t('auth.already_have_account')}
          <Link
            className="font-medium ml-2 text-orange-600 hover:text-orange-500 hover:underline transition-colors duration-300"
            to="/auth/login"
          >
            {t('auth.login')}
          </Link>
        </p>
      </div>
      <CommonForm
        formControls={registerFormControls}
        buttonText={t('auth.register')}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        buttonClassName="w-full bg-orange-600 hover:bg-orange-700 text-white transition-colors duration-300 rounded-xl h-12"
      />
    </div>
  );
}

export default AuthRegister;
