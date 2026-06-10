const express = require('express');
const router = express.Router();
const departmentController = require('../../controllers/admin_settings/departmentController');
router.get('/', (req, res) => departmentController.getAllDepartments(req, res));
router.post('/create', (req, res) => departmentController.createDepartment(req, res));
router.put('/update/:id', (req, res) => departmentController.updateDepartment(req, res));
router.delete('/delete/:id', (req, res) => departmentController.deleteDepartment(req, res));
module.exports = router;