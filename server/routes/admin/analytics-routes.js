const express = require("express");
const { getDashboardStats } = require("../../controllers/admin/analytics-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.get("/stats", authMiddleware, getDashboardStats);

module.exports = router;
