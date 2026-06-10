const express = require("express");
const router = express.Router();
const themeController = require('../../controllers/misc/sidebarThemeController');

router.get("/", themeController.getTheme);
router.put("/", themeController.updateTheme);

module.exports = router;
