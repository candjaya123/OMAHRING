const settingsService = require('./settings.service');

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const settings = await settingsService.getSettings();
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await settingsService.updateSettings(req.body);
      res.status(200).json({ success: true, message: 'Settings updated successfully', data: settings });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
