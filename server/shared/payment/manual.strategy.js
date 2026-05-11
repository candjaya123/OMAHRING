const paymentRecordsRepository = require('../../modules/orders/payment-records.repository');
const { imageUploadUtil } = require('../cloudinary.service');

const generateUniqueCode = () => Math.floor(Math.random() * 900) + 100;

const initiate = async (order, settings) => {
  const uniqueCode = generateUniqueCode();
  const totalWithCode = order.total_amount + uniqueCode;
  const expiresAt = new Date(Date.now() + (settings.payment_expiry_hours || 24) * 3600 * 1000);

  const record = await paymentRecordsRepository.create({
    order_id: order.id,
    payment_mode: 'manual',
    status: 'awaiting_proof',
    unique_code: uniqueCode,
    total_with_code: totalWithCode,
    expires_at: expiresAt
  });

  return {
    paymentMode: 'manual',
    instructions: {
      qrisUrl: settings.qris_image_url,
      bankAccounts: (settings.bank_accounts || []).filter(b => b.is_active),
      totalAmount: order.total_amount,
      uniqueCode,
      totalWithUniqueCode: totalWithCode,
      expiresAt: expiresAt.toISOString()
    },
    paymentRecordId: record.id
  };
};

const submitProof = async (orderId, imageFile) => {
  // Assuming imageFile is from multer memoryStorage
  const b64 = Buffer.from(imageFile.buffer).toString('base64');
  const dataUrl = `data:${imageFile.mimetype};base64,${b64}`;
  const result = await imageUploadUtil(dataUrl);

  await paymentRecordsRepository.updateByOrderId(orderId, {
    proof_image_url: result.secure_url,
    status: 'proof_submitted',
    updated_at: new Date()
  });

  return { proofUrl: result.secure_url };
};

const confirmPayment = async (orderId, adminUserId) => {
  const record = await paymentRecordsRepository.findByOrderId(orderId);
  if (!record || record.status === 'confirmed') return { alreadyConfirmed: true };

  await paymentRecordsRepository.updateByOrderId(orderId, {
    status: 'confirmed',
    confirmed_by: adminUserId,
    confirmed_at: new Date()
  });

  return { orderId, status: 'confirmed' };
};

const rejectPayment = async (orderId, adminUserId, reason) => {
  await paymentRecordsRepository.updateByOrderId(orderId, {
    status: 'rejected',
    rejection_reason: reason,
    confirmed_by: adminUserId
  });

  return { orderId, status: 'rejected' };
};

module.exports = { initiate, submitProof, confirmPayment, rejectPayment };
