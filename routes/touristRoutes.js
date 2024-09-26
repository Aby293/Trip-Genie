const express = require('express');
const touristController = require('../controllers/touristController');
const productController = require('../controllers/productController');
const itineraryController = require('../controllers/itineraryController.js');
const activityController = require('../controllers/activityController.js');
const  historicalPlacesController= require('../controllers/historicalPlacesController');

const router = express.Router();

router.get('/', touristController.getTourist);
router.put('/', touristController.updateTourist);
    
router.get('/sort-products-rating', productController.sortProductsByRating);
router.get('/itineraries', itineraryController.getAllItineraries);

router.post('/filter-activities',activityController.filterActivities);

router.get('/all-products', productController.getAllProducts);
router.get('/:name', productController.getProductbyName);

router.get('/filter-itinerary',itineraryController.filterItineraries);
router.get('/filter-historical-places',historicalPlacesController.filterHistoricalPlaces);

module.exports = router;