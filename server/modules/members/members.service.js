const membersRepository = require('./members.repository');
const bcrypt = require('bcryptjs');

class MembersService {
  async getAllUsers(requesterRole) {
    let allowedRoles = [];
    
    if (requesterRole === 'manager') {
      allowedRoles = ['admin', 'manager'];
    } else if (requesterRole === 'admin') {
      allowedRoles = ['user', 'member'];
    } else {
      throw new Error('Unauthorized to view users');
    }

    return await membersRepository.findAllByRoles(allowedRoles);
  }

  async createUser(data, requesterRole) {
    // Role validation
    if (requesterRole === 'manager') {
      if (!['admin', 'manager'].includes(data.role)) throw new Error('Manager can only create admin or manager');
    } else if (requesterRole === 'admin') {
      if (!['user', 'member'].includes(data.role)) throw new Error('Admin can only create user or member');
    }

    const existing = await membersRepository.findByEmail(data.email);
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    return await membersRepository.create({
      ...data,
      password: hashedPassword
    });
  }

  async updateUserRole(id, newRole, requesterRole, requesterId) {
    if (requesterId === id) throw new Error('Cannot change your own role');

    const user = await membersRepository.findById(id);
    if (!user) throw new Error('User not found');

    const canUpdate = this.validateRoleAccess(requesterRole, user.role, newRole);
    if (!canUpdate) throw new Error(`Cannot change role from ${user.role} to ${newRole}`);

    return await membersRepository.updateRole(id, newRole);
  }

  async deleteUser(id, requesterRole, requesterId) {
    if (requesterId === id) throw new Error('Cannot delete your own account');

    const user = await membersRepository.findById(id);
    if (!user) throw new Error('User not found');

    // Reuse role validation for deletion
    if (requesterRole === 'manager') {
      if (!['admin', 'manager'].includes(user.role)) throw new Error('Manager can only delete admin/manager');
    } else if (requesterRole === 'admin') {
      if (!['user', 'member'].includes(user.role)) throw new Error('Admin can only delete user/member');
    }

    return await membersRepository.softDelete(id);
  }

  validateRoleAccess(requesterRole, targetRole, newRole) {
    if (requesterRole === 'manager') {
      const allowed = ['admin', 'manager'];
      return allowed.includes(targetRole) && allowed.includes(newRole);
    }
    if (requesterRole === 'admin') {
      const allowed = ['user', 'member'];
      return allowed.includes(targetRole) && allowed.includes(newRole);
    }
    return false;
  }
}

module.exports = new MembersService();
