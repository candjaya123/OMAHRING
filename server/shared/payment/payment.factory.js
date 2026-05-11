const settingsService = require('../../modules/settings/settings.service');
const midtransStrategy = require('./midtrans.strategy');
const manualStrategy = require('./manual.strategy');

const getPaymentStrategy = async () => {
  const settings = await settingsService.getSettings();
  if (settings.payment_mode === 'manual') return manualStrategy;
  return midtransStrategy;
};

module.exports = { getPaymentStrategy };
