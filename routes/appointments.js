const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointments');
const { isCustomer, checkAccountStatus, attachUserData } = require('../middleware/auth');

router.get('/', isCustomer, checkAccountStatus, attachUserData, appointmentsController.loadAppointments);
router.get('/book/:serviceId', isCustomer, checkAccountStatus, appointmentsController.loadBookingPage);
router.post('/book', isCustomer, appointmentsController.createAppointment);
router.post('/:appointmentId/cancel', isCustomer, appointmentsController.cancelAppointment);
router.post('/:appointmentId/reschedule', isCustomer, appointmentsController.requestReschedule);

module.exports = router;
