import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, regenerateSnapToken } from '@/store/shop/order-slice';
import { Link, useNavigate, useParams } from 'react-router-dom';

const PaymentPendingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();

  const {
    orderDetails,
    isLoading,
    error,
    token: reduxToken,
  } = useSelector((state) => state.shopOrder);

  const [localToken, setLocalToken] = useState('');

  // 1. Fetch order details dari backend
  useEffect(() => {
    if (orderId) {
      dispatch(getOrderDetails({ id: orderId }));
    }
  }, [dispatch, orderId]);

  // 2. Kalau order unpaid/pending → regenerate snap token
  useEffect(() => {
    if (orderDetails && ['unpaid', 'pending'].includes(orderDetails.paymentStatus)) {
      dispatch(regenerateSnapToken(orderId))
        .unwrap()
        .then((res) => {
          setLocalToken(res.token);
          sessionStorage.setItem('snapToken', res.token);
          sessionStorage.setItem('currentOrderId', res.orderId);
        })
        .catch((err) => {
          console.error('Gagal regenerate token:', err);
        });
    }
  }, [dispatch, orderDetails, orderId]);

  // 3. Embed Snap begitu ada token
  useEffect(() => {
    const snapToken = localToken || reduxToken || sessionStorage.getItem('snapToken');
    if (!snapToken) return;

    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.snap) {
        window.snap.embed(snapToken, {
          embedId: 'snap-container',
          onSuccess: () => {
            sessionStorage.removeItem('snapToken');
            sessionStorage.removeItem('currentOrderId');
            navigate('/shop/payment-success');
          },
          onPending: () => {
            console.log('Pembayaran masih pending');
          },
          onError: () => {
            alert('Terjadi error saat pembayaran');
          },
          onClose: () => {
            console.log('User menutup pembayaran');
          },
        });
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [localToken, reduxToken, navigate]);

  // 4. UI handling
  if (isLoading) {
    return <div className="p-6 text-center">Memuat pembayaran...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="text-xl font-bold mb-3">Error</h2>
        <p>{typeof error === 'string' ? error : 'Pesanan tidak bisa diproses.'}</p>
        <Link to="/shop/account" className="text-blue-600 underline mt-4 block">
          Kembali ke Riwayat Pesanan
        </Link>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-3 text-red-600">Order Tidak Ditemukan</h2>
          <p className="mb-5 text-gray-600">
            Silakan lakukan checkout ulang untuk melanjutkan pembayaran.
          </p>
          <Link
            to="/shop/listing"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Kembali ke Halaman Belanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-blue-700">Selesaikan Pembayaran</h1>
        <p className="mb-6 text-center text-gray-600">
          Silakan selesaikan pembayaran Anda melalui metode yang tersedia di bawah ini.
        </p>
        <div id="snap-container" className="min-h-[400px]" />
      </div>
    </div>
  );
};

export default PaymentPendingPage;
