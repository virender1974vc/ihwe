const express = require('express');
const router = express.Router();
const delegateConfigController = require('../controllers/delegateConfigController');

// Public route to get all active days and sessions
router.get('/public', delegateConfigController.getDaysWithSessions);

// Admin routes
router.get('/admin/days/paginated', delegateConfigController.getDaysPaginated);
router.get('/admin/sessions/paginated', delegateConfigController.getSessionsPaginated);
router.get('/admin/passes/paginated', delegateConfigController.getPassesPaginated);

router.get('/admin', delegateConfigController.getAllDaysAdmin);
router.post('/days', delegateConfigController.createDay);
router.put('/days/:id', delegateConfigController.updateDay);
router.delete('/days/:id', delegateConfigController.deleteDay);

router.post('/sessions', delegateConfigController.createSession);
router.put('/sessions/:id', delegateConfigController.updateSession);
router.delete('/sessions/:id', delegateConfigController.deleteSession);

router.get('/admin/passes', delegateConfigController.getAllPassesAdmin);
router.post('/passes', delegateConfigController.createPass);
router.put('/passes/:id', delegateConfigController.updatePass);
router.delete('/passes/:id', delegateConfigController.deletePass);

module.exports = router;
