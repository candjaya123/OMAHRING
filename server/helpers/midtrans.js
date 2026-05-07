const midtransClient = require('midtrans-client');
const { getStoreSettings } = require('./store-settings-helper');

/**
 * Returns a configured Midtrans Snap instance dynamically.
 */
async function getMidtransSnap() {
  const settings = await getStoreSettings();

  const isProduction = settings.midtransIsProduction === true || settings.midtransIsProduction === "true";
  const serverKey = settings.midtransServerKey || process.env.MIDTRANS_SERVER_KEY;
  const clientKey = settings.midtransClientKey || process.env.MIDTRANS_CLIENT_KEY;

  return new midtransClient.Snap({
    isProduction: isProduction,
    serverKey: serverKey,
    clientKey: clientKey,
  });
}

module.exports = { getMidtransSnap };
