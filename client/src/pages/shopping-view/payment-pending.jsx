import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, regenerateSnapToken } from '@/store/shop/order-slice';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getValidToken,
  saveTokenWithTimestamp,
  clearAllTokens,
  getTokenRemainingTime,
  initializeTokenCleanup,
} from '@/utils/tokenUtils';

const PaymentPendingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();

  const { orderDetails, isLoading, error } = useSelector((state) => state.shopOrder);

  const [snapToken, setSnapToken] = useState('');
  const [isTokenReady, setIsTokenReady] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const snapEmbedded = useRef(false);
  const scriptLoaded = useRef(false);
  const cleanupFunction = useRef(null);

  // Initialize token cleanup on mount
  useEffect(() => {
    cleanupFunction.current = initializeTokenCleanup();

    return () => {
      if (cleanupFunction.current) {
        cleanupFunction.current();
      }
    };
  }, []);

  // Update remaining time every minute
  useEffect(() => {
    if (snapToken) {
      const updateTime = () => {
        const remaining = getTokenRemainingTime();
        setRemainingTime(remaining);

        // Auto redirect if token expired
        if (remaining <= 0) {
          setTokenError('Token pembayaran sudah kadaluarsa');
          handleRetry();
        }
      };

      updateTime(); // Initial update
      const interval = setInterval(updateTime, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [snapToken]);

  // 1. Load order details
  useEffect(() => {
    if (orderId) {
      dispatch(getOrderDetails({ id: orderId }));
    }
  }, [dispatch, orderId]);

  // 2. Check for existing token or generate new one
  useEffect(() => {
    if (!orderDetails) return;

    // // Debug current state
    // if (process.env.NODE_ENV === 'development') {
    //   debugTokenState();
    // }

    // Handle different order statuses
    if (orderDetails.paymentStatus === 'paid') {
      navigate('/shop/payment-success', { replace: true });
      return;
    }

    if (['failed', 'cancelled', 'expired'].includes(orderDetails.paymentStatus)) {
      navigate('/shop/checkout', {
        replace: true,
        state: { error: 'Pembayaran gagal atau dibatalkan' },
      });
      return;
    }

    // Check for valid existing token
    const validToken = getValidToken(orderId);
    if (validToken) {
      console.log('Using valid token from storage');
      setSnapToken(validToken);
      setIsTokenReady(true);
      setTokenError('');
      return;
    }

    // Generate new token if needed
    if (['unpaid', 'pending'].includes(orderDetails.paymentStatus)) {
      console.log('Generating new token for order:', orderId);

      dispatch(regenerateSnapToken(orderId))
        .unwrap()
        .then((res) => {
          if (res.token) {
            setSnapToken(res.token);
            setIsTokenReady(true);

            // Clear old tokens and save new one with timestamp
            clearAllTokens();
            saveTokenWithTimestamp(res.token, orderId);

            setTokenError('');
          }
        })
        .catch((err) => {
          console.error('Failed to regenerate token:', err);
          setTokenError(err.message || 'Gagal membuat token pembayaran');
          setIsTokenReady(false);
        });
    }
  }, [dispatch, orderDetails, orderId, navigate]);

  // 3. Load Snap script and embed payment
  useEffect(() => {
    if (!snapToken || !isTokenReady) return;
    if (snapEmbedded.current) return; // Prevent multiple embeds

    const loadSnapScript = () => {
      // If script already exists and loaded, embed directly
      if (window.snap && scriptLoaded.current) {
        embedSnap();
        return;
      }

      // Remove existing script if any
      const existingScript = document.querySelector('script[src*="snap.js"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Load new script
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
      script.async = true;

      script.onload = () => {
        scriptLoaded.current = true;
        embedSnap();
      };

      script.onerror = () => {
        setTokenError('Gagal memuat script pembayaran');
      };

      document.body.appendChild(script);

      // Cleanup function
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    };

    const embedSnap = () => {
      if (!window.snap || snapEmbedded.current) return;

      try {
        // Clear container first
        const container = document.getElementById('snap-container');
        if (container) {
          container.innerHTML = '';
        }

        window.snap.embed(snapToken, {
          embedId: 'snap-container',
          onSuccess: (result) => {
            console.log('Payment success:', result);
            clearAllTokens();
            navigate('/shop/payment-success', { replace: true });
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
          },
          onError: (result) => {
            console.error('Payment error:', result);
            setTokenError('Terjadi kesalahan saat memproses pembayaran');
          },
          onClose: () => {
            console.log('Payment popup closed');
          },
        });

        snapEmbedded.current = true;
        setTokenError('');
      } catch (error) {
        console.error('Error embedding snap:', error);
        setTokenError('Gagal memuat interface pembayaran');
      }
    };

    const cleanup = loadSnapScript();

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
      snapEmbedded.current = false;
    };
  }, [snapToken, isTokenReady, navigate]);

  // Reset embed flag when token changes
  useEffect(() => {
    snapEmbedded.current = false;
  }, [snapToken]);

  // Handle retry payment
  const handleRetry = () => {
    // Clear all tokens and states
    clearAllTokens();
    setSnapToken('');
    setIsTokenReady(false);
    setTokenError('');
    setRemainingTime(0);
    snapEmbedded.current = false;

    // Reload order details to trigger token regeneration
    if (orderId) {
      dispatch(getOrderDetails({ id: orderId }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pembayaran...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || tokenError) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-3 text-red-600">Error</h2>
          <p className="text-gray-600 mb-4">
            {tokenError || (typeof error === 'string' ? error : 'Pesanan tidak bisa diproses.')}
          </p>
          <div className="space-x-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Coba Lagi
            </button>
            <Link
              to="/shop/account"
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Riwayat Pesanan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Order not found
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
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-blue-700">Selesaikan Pembayaran</h1>
          <p className="text-gray-600">
            Order ID: <span className="font-mono font-semibold">{orderDetails._id}</span>
          </p>
          <p className="text-lg font-semibold text-green-600">
            Total: Rp {orderDetails.totalAmount?.toLocaleString('id-ID')}
          </p>
          {remainingTime > 0 && (
            <p className="text-sm text-orange-600 mt-2">
              Token kadaluarsa dalam: {remainingTime} menit
            </p>
          )}
        </div>

        {!isTokenReady ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Menyiapkan pembayaran...</p>
          </div>
        ) : (
          <div>
            <div id="snap-container" className="min-h-[500px] border rounded-lg" />
            <div className="text-center mt-4 space-y-2">
              <button
                onClick={handleRetry}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Bermasalah? Muat ulang pembayaran
              </button>
              {remainingTime > 0 && remainingTime <= 10 && (
                <p className="text-xs text-red-500">
                  Token akan segera kadaluarsa! Selesaikan pembayaran segera.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPendingPage;
