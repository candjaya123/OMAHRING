const midtransClient = require('midtrans-client');
const paymentRecordsRepository = require('../../modules/orders/payment-records.repository');
const settingsService = require('../../modules/settings/settings.service');

const getMidtransSnap = async () => {
  const settings = await settingsService.getSettings();
  return new midtransClient.Snap({
    isProduction: settings.midtrans_is_production || false,
    serverKey: process.env.MIDTRANS_SERVER_KEY, // Preferred from env for security
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });
};

const initiate = async (order, settings) => {
  const snap = await getMidtransSnap();
  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: order.id,
      gross_amount: order.total_amount
    },
    customer_details: {
      first_name: order.customer_name,
      email: order.email
    }
  });

  const record = await paymentRecordsRepository.create({
    order_id: order.id,
    payment_mode: 'midtrans',
    status: 'awaiting_proof', // Equivalent to 'pending' in Midtrans
    midtrans_order_id: order.id,
    midtrans_snap_token: transaction.token,
    midtrans_token_expiry: new Date(Date.now() + 120 * 60 * 1000), // 2 hours
    expires_at: new Date(Date.now() + 120 * 60 * 1000)
  });

  return {
    paymentMode: 'midtrans',
    instructions: {
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url
    },
    paymentRecordId: record.id
  };
};

const handleWebhook = async (payload) => {
  const snap = await getMidtransSnap();
  const notification = await snap.transaction.notification(payload);
  const { order_id, transaction_status, fraud_status } = notification;

  let status = 'awaiting_proof';
  if (transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept')) {
    status = 'confirmed';
  } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
    status = 'expired';
  }

  return { orderId: order_id, status, rawPayload: notification };
};

module.exports = { initiate, handleWebhook };
