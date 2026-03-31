const express = require("express");
const router = express.Router();
const pageController = require("../controllers/customPageController");

router.get("/", pageController.getAllPages);
router.get("/slug/:slugOrId", pageController.getPageBySlugOrId);
router.post("/", pageController.createPage);
router.put("/:id", pageController.updatePage);
router.delete("/:id", pageController.deletePage);

module.exports = router;
