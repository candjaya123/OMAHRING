import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, regenerateSnapToken } from '@/store/shop/order-slice';
import { Link, useNavigate, useParams } from 'react-router-dom';

const MIDTRANS_SNAP_SRC = 'https://app.sandbox.midtrans.com/snap/snap.js';
const MIDTRANS_SCRIPT_ID = 'midtrans-snap-script';

const PaymentPendingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();

  const { orderDetails, isLoading, error } = useSelector((state) => state.shopOrder);

  const [snapToken, setSnapToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const pollRef = useRef(null);

  // 1) Fetch order details saat pertama kali load
  useEffect(() => {
    if (orderId) {
      dispatch(getOrderDetails({ id: orderId }));
    }
  }, [dispatch, orderId]);

  // 2) Cek status order & token validity
  useEffect(() => {
    if (!orderDetails) return;

    const paidStatuses = ['paid', 'settlement', 'capture', 'success'];

    // Jika sudah paid, redirect ke success
    if (paidStatuses.includes(orderDetails.paymentStatus)) {
      navigate('/shop/payment-success');
      return;
    }

    // Jika order expired atau cancelled
    if (['expired', 'cancelled', 'failed'].includes(orderDetails.orderStatus)) {
      return; // UI akan menampilkan pesan error
    }

    // Cek token yang ada
    const existingToken = orderDetails.midtrans?.snapToken;
    const expiry = orderDetails.midtrans?.tokenExpiry
      ? new Date(orderDetails.midtrans.tokenExpiry)
      : null;

    const isTokenValid = expiry && expiry > new Date();

    if (existingToken && isTokenValid) {
      // Token masih valid, gunakan yang ada
      setSnapToken(existingToken);
      setTokenExpiry(expiry);
      console.log('✅ Menggunakan token yang sudah ada');
    } else if (
      orderDetails.paymentStatus === 'unpaid' ||
      orderDetails.paymentStatus === 'pending'
    ) {
      // Token expired atau tidak ada, regenerate
      console.log('🔄 Token expired/tidak ada, regenerate...');
      handleRegenerateToken();
    }
  }, [orderDetails, navigate, orderId]);

  // 3) Function untuk regenerate token
  const handleRegenerateToken = async () => {
    if (isRegenerating) return; // Prevent double call

    setIsRegenerating(true);
    try {
      const result = await dispatch(regenerateSnapToken(orderId)).unwrap();
      setSnapToken(result.token);

      if (result.expiresAt) {
        setTokenExpiry(new Date(result.expiresAt));
      }

      console.log(result.isRegenerated ? '✅ Token baru dibuat' : '✅ Token existing masih valid');
    } catch (e) {
      console.error('Regenerate token failed:', e);
    } finally {
      setIsRegenerating(false);
    }
  };

  // 4) Render Snap popup ketika token tersedia
  useEffect(() => {
    if (!snapToken) return;

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
        // Mulai polling status order tiap 5 detik
        if (!pollRef.current) {
          pollRef.current = setInterval(async () => {
            try {
              const res = await dispatch(getOrderDetails({ id: orderId })).unwrap();
              if (['paid', 'settlement', 'capture', 'success'].includes(res?.paymentStatus)) {
                clearInterval(pollRef.current);
                pollRef.current = null;
                navigate('/shop/payment-success');
              }
              // eslint-disable-next-line no-unused-vars
            } catch (_) {
              // Ignore errors saat polling
            }
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
      if (window.snap && snapToken) {
        window.snap.embed(snapToken, { embedId: 'snap-container', ...callbacks });
      }
    });

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [snapToken, dispatch, navigate, orderId]);

  // === UI RENDERING ===

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pembayaran...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3 text-red-600">Error</h2>
          <p className="text-gray-700 mb-5">
            {typeof error === 'string' ? error : 'Pesanan tidak bisa diproses.'}
          </p>
          <Link
            to="/shop/account"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Kembali ke Riwayat Pesanan
          </Link>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
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

  // Jika order sudah expired atau cancelled
  if (['expired', 'cancelled', 'failed'].includes(orderDetails.orderStatus)) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3 text-orange-600">
            Pembayaran {orderDetails.orderStatus === 'expired' ? 'Kadaluarsa' : 'Dibatalkan'}
          </h2>
          <p className="mb-5 text-gray-600">
            Pesanan ini sudah {orderDetails.orderStatus === 'expired' ? 'kadaluarsa' : 'dibatalkan'}
            . Silakan buat pesanan baru.
          </p>
          <Link
            to="/shop/listing"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Belanja Lagi
          </Link>
        </div>
      </div>
    );
  }

  // Tampilkan countdown timer jika ada expiry
  const renderExpiryTimer = () => {
    if (!tokenExpiry) return null;

    const now = new Date();
    const diff = tokenExpiry - now;

    if (diff <= 0) {
      return (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-center">
          <p className="text-red-700 font-medium">⚠️ Token pembayaran telah kadaluarsa</p>
          <button
            onClick={handleRegenerateToken}
            disabled={isRegenerating}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
          >
            {isRegenerating ? 'Memuat...' : 'Perpanjang Waktu Pembayaran'}
          </button>
        </div>
      );
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return (
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-center">
        <p className="text-blue-700">
          ⏱️ Waktu pembayaran tersisa:{' '}
          <strong>
            {minutes}m {seconds}s
          </strong>
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-blue-700">Selesaikan Pembayaran</h1>

        {renderExpiryTimer()}

        <p className="mb-6 text-center text-gray-600">
          {snapToken
            ? 'Silakan selesaikan pembayaran Anda melalui metode yang tersedia di bawah ini.'
            : isRegenerating
            ? 'Memuat token pembayaran...'
            : 'Sedang mempersiapkan pembayaran...'}
        </p>

        {snapToken ? (
          <div id="snap-container" className="min-h-[420px] border rounded" />
        ) : (
          <div className="mt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-4">Memuat metode pembayaran...</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition"
            >
              Refresh Halaman
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-500 mb-3">
            Order ID: <span className="font-mono font-medium">{orderDetails._id}</span>
          </p>
          <Link to="/shop/account" className="text-blue-600 hover:text-blue-700 underline text-sm">
            Lihat Riwayat Pesanan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentPendingPage;
