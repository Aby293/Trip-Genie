const express = require('express');
const touristController = require('../controllers/touristController');
const productController = require('../controllers/productController');
const itineraryController = require('../controllers/itineraryController.js');

const router = express.Router();

router.get('/', touristController.getTourist);
router.put('/', touristController.updateTourist);
    
router.get('/sort-products-rating', productController.sortProductsByRating);
router.get('/itineraries', itineraryController.getAllItineraries);

router.get('/filterActivities',touristController.filterActivities);
router.get('/getMyActivities',touristController.getActivitiesByTourist);

router.get('/filterItinerary',itineraryController.filterItineraries);
module.exports = router;