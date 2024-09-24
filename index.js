require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const museumRoutes=require('./routes/museumRoutes');
const categoryRoutes=require('./routes/categoryRoutes');
const touristRoutes = require('./routes/touristRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tourismGovernorRoutes = require('./routes/tourismGovernorRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const touristItineraryRoutes = require('./routes/touristItineraryRoutes');
const sellerRoutes = require("./routes/sellerRoutes"); 
const activityRoutes = require("./routes/activityRoutes");
const cookieParser = require('cookie-parser');
const {requireAuth} = require('./middlewares/authMiddleware');

const PORT = process.env.PORT;

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());
app.use(cookieParser())


mongoose.connect(process.env.URI)
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => console.log(err));

app.get('/', requireAuth, (req, res) => {
  res.send('Hello From Sam');
});

app.use(authRoutes);
app.use('/admin', requireAuth, adminRoutes);
app.use('/admin', requireAuth, tourismGovernorRoutes);
app.use('/tourist', requireAuth, touristRoutes);
app.use('/itinerary', requireAuth, itineraryRoutes);
app.use('/touristItinerary', requireAuth, touristItineraryRoutes);
app.use('/seller', requireAuth, sellerRoutes);
app.use('/activity',requireAuth, activityRoutes);
app.use('/category', requireAuth, museumRoutes);
app.use('/museums',requireAuth, categoryRoutes);


