const analyticsService = require('./analytics.service');

class AnalyticsController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await analyticsService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
