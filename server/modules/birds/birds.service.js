const birdsRepository = require('./birds.repository');

class BirdsService {
  async registerBird(data) {
    const { competitions, ...birdData } = data;

    // 1. Create bird profile
    const bird = await birdsRepository.createBird(birdData);

    // 2. Add competitions if any
    if (competitions && competitions.length > 0) {
      await birdsRepository.addCompetitions(bird.id, competitions);
    }

    // 3. Generate QR Code URL (Logic to be implemented or using external service)
    // For now: placeholder URL
    const qrUrl = `https://omahring.com/bird/${bird.id}`; 
    // In real implementation, we might use a library to generate an image and upload to Cloudinary

    return await birdsRepository.findById(bird.id);
  }

  async getBirdProfile(id) {
    const bird = await birdsRepository.findById(id);
    if (!bird) {
      const error = new Error('Bird profile not found');
      error.statusCode = 404;
      throw error;
    }
    return bird;
  }

  async getMemberBirds(memberId) {
    return await birdsRepository.findByMemberId(memberId);
  }

  async deleteBird(id) {
    return await birdsRepository.softDelete(id);
  }
}

module.exports = new BirdsService();
