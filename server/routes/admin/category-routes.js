const express = require("express");
const {
  addCategory,
  fetchAllCategories,
} = require("../../controllers/admin/category-controller");

const router = express.Router();

router.post("/add", addCategory);
router.get("/get", fetchAllCategories);

module.exports = router;
