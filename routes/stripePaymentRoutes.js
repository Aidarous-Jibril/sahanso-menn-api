const express = require('express')
const router = express.Router()
const { processStripe, loadStripe } = require('../controllers/paymentController')


router.get('/stripeapikey', loadStripe)
router.post('/process', processStripe)


module.exports = router
