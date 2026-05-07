const express = require("express");
const { 
    fetchShopArticles, 
    fetchShopCategories, 
    joinCommunity,
    submitContent
} = require("../../controllers/shop/common-controller");

const router = express.Router();

router.get("/articles", fetchShopArticles);
router.get("/categories", fetchShopCategories);
router.post("/join-community", joinCommunity);
router.post("/submit-content", submitContent);

module.exports = router;
