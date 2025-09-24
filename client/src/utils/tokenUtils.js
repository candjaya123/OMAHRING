// utils/tokenUtils.js

/**
 * Token management utilities untuk Midtrans Snap
 */

// Durasi token valid (2 jam dari Midtrans)
const TOKEN_VALID_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

/**
 * Membersihkan token yang expired dari sessionStorage
 */
export const clearExpiredTokens = () => {
  try {
    const tokenData = sessionStorage.getItem('snapTokenData');
    if (!tokenData) return;

    const parsedData = JSON.parse(tokenData);
    const now = Date.now();

    if (parsedData.timestamp && now - parsedData.timestamp > TOKEN_VALID_DURATION) {
      sessionStorage.removeItem('snapToken');
      sessionStorage.removeItem('currentOrderId');
      sessionStorage.removeItem('snapTokenData');
      console.log('Expired token cleared from storage');
    }
  } catch (error) {
    console.error('Error clearing expired tokens:', error);
    // Clear all if error
    sessionStorage.removeItem('snapToken');
    sessionStorage.removeItem('currentOrderId');
    sessionStorage.removeItem('snapTokenData');
  }
};

/**
 * Menyimpan token dengan timestamp
 */
export const saveTokenWithTimestamp = (token, orderId) => {
  try {
    const tokenData = {
      token,
      orderId,
      timestamp: Date.now(),
    };

    sessionStorage.setItem('snapToken', token);
    sessionStorage.setItem('currentOrderId', orderId);
    sessionStorage.setItem('snapTokenData', JSON.stringify(tokenData));

    console.log('Token saved with timestamp');
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

/**
 * Mengambil token yang valid (belum expired)
 */
export const getValidToken = (orderId) => {
  try {
    clearExpiredTokens(); // Bersihkan dulu yang expired

    const token = sessionStorage.getItem('snapToken');
    const savedOrderId = sessionStorage.getItem('currentOrderId');
    const tokenData = sessionStorage.getItem('snapTokenData');

    // Pastikan token untuk order yang sama dan masih valid
    if (token && savedOrderId === orderId && tokenData) {
      const parsedData = JSON.parse(tokenData);
      const now = Date.now();

      if (parsedData.timestamp && now - parsedData.timestamp <= TOKEN_VALID_DURATION) {
        return token;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting valid token:', error);
    return null;
  }
};

/**
 * Membersihkan semua token data
 */
export const clearAllTokens = () => {
  try {
    sessionStorage.removeItem('snapToken');
    sessionStorage.removeItem('currentOrderId');
    sessionStorage.removeItem('snapTokenData');
    console.log('All tokens cleared');
  } catch (error) {
    console.error('Error clearing all tokens:', error);
  }
};

/**
 * Mengecek apakah token masih valid
 */
export const isTokenValid = (orderId) => {
  return getValidToken(orderId) !== null;
};

/**
 * Mendapatkan sisa waktu token dalam menit
 */
export const getTokenRemainingTime = () => {
  try {
    const tokenData = sessionStorage.getItem('snapTokenData');
    if (!tokenData) return 0;

    const parsedData = JSON.parse(tokenData);
    const now = Date.now();
    const elapsed = now - parsedData.timestamp;
    const remaining = TOKEN_VALID_DURATION - elapsed;

    return Math.max(0, Math.floor(remaining / (60 * 1000))); // in minutes
  } catch (error) {
    console.error('Error getting remaining time:', error);
    return 0;
  }
};

/**
 * Auto cleanup on page load
 */
export const initializeTokenCleanup = () => {
  // Clear expired tokens saat page load
  clearExpiredTokens();

  // Set interval untuk cleanup periodic (setiap 5 menit)
  const cleanupInterval = setInterval(clearExpiredTokens, 5 * 60 * 1000);

  // Cleanup saat tab/window ditutup
  const handleBeforeUnload = () => {
    clearInterval(cleanupInterval);
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    clearInterval(cleanupInterval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};

/**
 * Debug utilities
 */
export const debugTokenState = () => {
  try {
    const token = sessionStorage.getItem('snapToken');
    const orderId = sessionStorage.getItem('currentOrderId');
    const tokenData = sessionStorage.getItem('snapTokenData');

    console.group('Token Debug State');
    console.log('Token exists:', !!token);
    console.log('Order ID:', orderId);
    console.log('Token data:', tokenData ? JSON.parse(tokenData) : null);
    console.log('Remaining time (minutes):', getTokenRemainingTime());
    console.groupEnd();
  } catch (error) {
    console.error('Error debugging token state:', error);
  }
};
