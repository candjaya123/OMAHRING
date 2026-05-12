const settingsRepository = require('./settings.repository');

class SettingsService {
  async getSettings() {
    const settings = await settingsRepository.get();
    if (!settings) {
      return {
        store_name: 'OMAHRING',
        store_service_fee: 0,
        midtrans_is_production: false
      };
    }
    return settings;
  }

  async getInternalSettings() {
    return await settingsRepository.getWithSecrets();
  }

  async updateSettings(data) {
    return await settingsRepository.update(data);
  }
}

module.exports = new SettingsService();
