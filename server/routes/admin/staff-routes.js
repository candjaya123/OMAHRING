const express = require('express');
const { addNewStaff, getAllStaff, updateStaff, deleteStaff } = require('../../controllers/admin/staff-controller');
const { authMiddleware } = require('../../controllers/auth/auth-controller');

const router = express.Router();

// Both routes are protected by authMiddleware
// The controller will further validate if the user is an admin for adding staff
router.post('/add', authMiddleware, addNewStaff);
router.get('/get', authMiddleware, getAllStaff);
router.put('/update/:id', authMiddleware, updateStaff);
router.delete('/delete/:id', authMiddleware, deleteStaff);

module.exports = router;
