const express = require("express");
const {
  addArticle,
  fetchAllArticles,
  fetchMemberArticles,
  editArticle,
  deleteArticle,
} = require("../../controllers/admin/article-controller");
const { authenticate, authorizeRoles } = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/add", authenticate, authorizeRoles('admin', 'manager', 'member'), addArticle);
router.get("/get", fetchAllArticles);
router.get("/get-member", authenticate, authorizeRoles('admin', 'manager', 'member'), fetchMemberArticles);
router.put("/edit/:id", authenticate, authorizeRoles('admin', 'manager', 'member'), editArticle);
router.delete("/delete/:id", authenticate, authorizeRoles('admin', 'manager', 'member'), deleteArticle);

module.exports = router;
