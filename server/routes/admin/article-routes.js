const express = require("express");
const {
  addArticle,
  fetchAllArticles,
  editArticle,
  deleteArticle,
} = require("../../controllers/admin/article-controller");

const router = express.Router();

router.post("/add", addArticle);
router.get("/get", fetchAllArticles);
router.put("/edit/:id", editArticle);
router.delete("/delete/:id", deleteArticle);

module.exports = router;
