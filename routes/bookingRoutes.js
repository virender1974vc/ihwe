const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// All routes are typically protected in production, but following current app patterns
router.get('/', bookingController.getAllBookings);
router.delete('/:id', bookingController.deleteBooking);
router.post('/bulk-delete', bookingController.bulkDeleteBookings);
router.patch('/:id/status', bookingController.updateBookingStatus);
router.post('/bulk-update-status', bookingController.bulkUpdateBookingStatus);

module.exports = router;
