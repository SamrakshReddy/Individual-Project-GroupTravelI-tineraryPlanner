const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  addExpense,
  addActivity,
} = require('../controllers/tripsController');


router.get('/', auth, getTrips);
router.get('/:id', auth, getTrip);
router.post('/', auth, createTrip);
router.put('/:id', auth, updateTrip);
router.delete('/:id', auth, deleteTrip);
router.post('/:id/expenses', auth, addExpense);
router.post('/:id/activities', auth, addActivity);
module.exports = router;
