import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, regenerateSnapToken } from '@/store/shop/order-slice';
import { Link, useNavigate, useParams } from 'react-router-dom';

const MIDTRANS_SNAP_SRC = 'https://app.sandbox.midtrans.com/snap/snap.js';
const MIDTRANS_SCRIPT_ID = 'midtrans-snap-script';

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

  const pollRef = useRef(null);

  useEffect(() => {
    if (orderId) {
      dispatch(getOrderDetails({ id: orderId }));
    }
  }, [dispatch, orderId]);

  useEffect(() => {
    if (!orderDetails) return;

    const paidStatuses = ['paid', 'settlement', 'capture', 'success'];

    if (paidStatuses.includes(orderDetails.paymentStatus)) {
      navigate('/shop/payment-success');
      return;
    }

    // Hanya regenerate token jika unpaid DAN belum ada token sama sekali
    if (orderDetails.paymentStatus === 'unpaid' && !reduxToken) {
      dispatch(regenerateSnapToken(orderId))
        .unwrap()
        .catch((e) => {
          console.error('Regenerate token failed:', e);
        });
    }
  }, [orderDetails, dispatch, navigate, orderId, reduxToken]);

  /**
   * Render Snap popup ketika token dari redux sudah tersedia
   */
  useEffect(() => {
    if (!reduxToken) return;

    const ensureSnapScript = () =>
      new Promise((resolve) => {
        const existing = document.getElementById(MIDTRANS_SCRIPT_ID);
        if (existing && window.snap) return resolve();

        if (!existing) {
          const s = document.createElement('script');
          s.src = MIDTRANS_SNAP_SRC;
          s.async = true;
          s.id = MIDTRANS_SCRIPT_ID;
          s.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
          s.onload = () => resolve();
          document.body.appendChild(s);
        } else {
          existing.addEventListener('load', () => resolve(), { once: true });
        }
      });

    const callbacks = {
      onSuccess: () => {
        navigate('/shop/payment-success');
      },
      onPending: () => {
        // mulai polling status order tiap 5 detik
        if (!pollRef.current) {
          pollRef.current = setInterval(async () => {
            try {
              const res = await dispatch(getOrderDetails({ id: orderId })).unwrap();
              if (['paid', 'settlement', 'capture', 'success'].includes(res?.paymentStatus)) {
                clearInterval(pollRef.current);
                pollRef.current = null;
                navigate('/shop/payment-success');
              }
            } catch (_) {}
          }, 5000);
        }
      },
      onError: () => {
        console.warn('Terjadi error saat pembayaran');
      },
      onClose: () => {
        console.log('User menutup pembayaran');
      },
    };

    let cancelled = false;

    ensureSnapScript().then(() => {
      if (cancelled) return;
      if (window.snap && reduxToken) {
        // Menggunakan snap.embed untuk menampilkan di dalam div
        window.snap.embed(reduxToken, { embedId: 'snap-container', ...callbacks });
      }
    });

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [reduxToken, dispatch, navigate, orderId]);

  // UI
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
          {reduxToken
            ? 'Silakan selesaikan pembayaran Anda melalui metode yang tersedia di bawah ini.'
            : 'Memuat token pembayaran...'}
        </p>
        {reduxToken ? (
          <div id="snap-container" className="min-h-[420px] border rounded" />
        ) : (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPendingPage;
