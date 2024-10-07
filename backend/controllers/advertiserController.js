const Advertiser = require("../models/advertiser");
const Tourist = require("../models/tourist");
const TourGuide = require("../models/tourGuide");
const Seller = require("../models/seller");
const Admin = require("../models/admin");
const TourismGovernor = require("../models/tourismGovernor");
const Activity = require("../models/activity");
const { deleteActivity } = require("./activityController");
const authController = require("./authController");

const deleteAdvertiserAccount = async (req, res) => {
  try {
    const advertiser = await Advertiser.findByIdAndDelete(req.params.id);
    if (!advertiser) {
      return res.status(404).json({ message: "Advertiser not found" });
    }

    // Find all activities associated with the advertiser
    const activities = await Activity.find({ advertiser: req.params.id });

    // Call the deleteActivity method for each activity associated with the advertiser
    for (const activity of activities) {
      await deleteActivity({ params: { id: activity._id } }, res);
    }

    res
      .status(201)
      .json({ message: "Advertiser and associated activities deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllAdvertisers = async (req, res) => {
  try {
    const advertiser = await Advertiser.find().sort({ createdAt: -1 });
    res.status(200).json(advertiser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAdvertiserByID = async (req, res) => {
  try {
    const advertiser = await Advertiser.findById(req.params.id);
    if (!advertiser) {
      return res.status(404).json({ message: "Advertiser not found" });
    }
    res.status(200).json(advertiser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAdvertiser = async (req, res) => {
  try {
    const advertiser1 = await Advertiser.findById(res.locals.user_id);
    if (!advertiser1.isAccepted) {
      return res.status(400).json({
        error: "Advertiser is not accepted yet, Can not update profile",
      });
    }

    const { email, username, name, description, hotline, website } = req.body;
    if (username !== advertiser1.username && (await usernameExists(username))) {
      return res.status(400).json({ message: "Username already exists" });
    }
    if (email !== advertiser1.email && (await emailExists(email))) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const advertiser = await Advertiser.findByIdAndUpdate(
      res.locals.user_id,
      { email, username, name, description, hotline, website },
      { new: true, runValidators: true }
    );

    if (!advertiser) {
      return res.status(400).json({ error: "Advertiser not found" });
    }
    res.status(200).json({ message: "Advertiser profile updated", advertiser });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Error updating advertiser profile" });
  }
};

const getAdvertiser = async (req, res) => {
  try {
    const advertiser = await Advertiser.findById(res.locals.user_id);
    if (!advertiser.isAccepted) {
      return res.status(400).json({
        error: "Advertiser is not accepted yet, Can not view profile",
      });
    }
    if (!advertiser) {
      return res.status(404).json({ message: "Advertiser not found" });
    }
    res.status(200).json(advertiser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const emailExists = async (email) => {
  if (await Tourist.findOne({ email })) {
    return true;
  } else if (await TourGuide.findOne({ email })) {
    return true;
  } else if (await Advertiser.findOne({ email })) {
    return true;
  } else if (await Seller.findOne({ email })) {
    return true;
  } else {
    console.log("email does not exist");
    return false;
  }
};

const usernameExists = async (username) => {
  if (
    (await Tourist.findOne({ username })) ||
    (await TourGuide.findOne({ username })) ||
    (await Advertiser.findOne({ username })) ||
    (await Seller.findOne({ username })) ||
    (await Admin.findOne({ username })) ||
    (await TourismGovernor.findOne({ username }))
  ) {
    console.log("username exists");
    return true;
  } else {
    console.log("username does not exist");
    return false;
  }
};

module.exports = {
  deleteAdvertiserAccount,
  getAllAdvertisers,
  getAdvertiserByID,
  updateAdvertiser,
  getAdvertiser,
};
