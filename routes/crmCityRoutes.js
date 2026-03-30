const express = require("express");
const {
  getAllCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
} = require("../controllers/crmCityController.js");

const router = express.Router();

router.get("/", getAllCities); // GET all cities
router.get("/:id", getCityById); // GET single city
router.post("/", createCity); // CREATE city
router.put("/:id", updateCity); // UPDATE city
router.delete("/:id", deleteCity); // DELETE city

module.exports = router;
