const express = require("express");
const {
  getAllCountries,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
} = require("../controllers/crmCountryController.js");

const router = express.Router();

router.get("/", getAllCountries); // GET all countries
router.get("/:id", getCountryById); // GET single country
router.post("/", createCountry); // CREATE country
router.put("/:id", updateCountry); // UPDATE country
router.delete("/:id", deleteCountry); // DELETE country

module.exports = router;
