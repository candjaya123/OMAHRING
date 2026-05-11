const birdsService = require('./birds.service');

class BirdsController {
  async registerBird(req, res, next) {
    try {
      const bird = await birdsService.registerBird(req.body);
      res.status(201).json({
        success: true,
        message: 'Bird registered successfully',
        data: bird
      });
    } catch (error) {
      next(error);
    }
  }

  async getBirdDetails(req, res, next) {
    try {
      const bird = await birdsService.getBirdProfile(req.params.id);
      res.status(200).json({
        success: true,
        data: bird
      });
    } catch (error) {
      next(error);
    }
  }

  async getMemberBirds(req, res, next) {
    try {
      const birds = await birdsService.getMemberBirds(req.params.memberId);
      res.status(200).json({
        success: true,
        data: birds
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBird(req, res, next) {
    try {
      await birdsService.deleteBird(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Bird profile deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BirdsController();
