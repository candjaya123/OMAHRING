const membersService = require('./members.service');

class MembersController {
  async getAllUsers(req, res, next) {
    try {
      const users = await membersService.getAllUsers(req.user.role);
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await membersService.createUser(req.body, req.user.role);
      res.status(201).json({ success: true, message: 'User created successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const user = await membersService.updateUserRole(req.params.id, req.body.role, req.user.role, req.user.id);
      res.status(200).json({ success: true, message: 'User role updated successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await membersService.deleteUser(req.params.id, req.user.role, req.user.id);
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MembersController();
